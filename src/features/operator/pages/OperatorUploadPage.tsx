import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Trash2, Upload } from "lucide-react";
import axios from "axios";
import OperatorTopNav from "../components/OperatorTopNav";
import { api } from "../../../services/api";
import type { CaseImageSummary } from "../types/operator.types";

type MagnificationValue = "X10" | "X40";

export default function OperatorUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId") ?? "";
  const [magnification, setMagnification] = useState<MagnificationValue>("X10");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patientName, setPatientName] = useState<string>("-");
  const [patientNoInduk, setPatientNoInduk] = useState<string>("-");
  const [caseStatus, setCaseStatus] = useState<string>("-");
  const [queue, setQueue] = useState<CaseImageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canUpload = caseId.length > 0 && caseStatus === "PENDING_UPLOAD";
  const canSubmit = caseId.length > 0 && caseStatus === "PENDING_UPLOAD" && queue.length > 0;

  const explainEndpointMissing = () =>
    "Endpoint upload image tidak ditemukan (404). Backend harus menyediakan route /api/cases/:id/images (presigned-urls, images, confirm, submit).";

  const inferMimeType = (file: File) => {
    if (file.type) return file.type.toLowerCase();
    const name = file.name.toLowerCase();
    if (name.endsWith(".tif") || name.endsWith(".tiff") || name.endsWith(".svs")) return "image/tiff";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".png")) return "image/png";
    return "application/octet-stream";
  };

  const sanitizeFilename = (name: string) => {
    const trimmed = name.trim().replace(/\s+/g, " ");
    const parts = trimmed.split(".");
    const ext = parts.length > 1 ? `.${parts.pop()}` : "";
    const base = parts.join(".") || "file";
    const safeBase = base.replace(/[^\w\-\. ]+/g, "_");
    const safe = `${safeBase}${ext}`;
    return safe.length > 255 ? safe.slice(0, 255) : safe;
  };

  const refreshCase = async () => {
    if (!caseId) return;
    setErrorMsg(null);
    try {
      setLoading(true);
      const res = await api.get(`/cases/${caseId}`);
      const data = (res.data as any)?.data;
      const patient = data?.patient ?? {};
      setPatientName(String(patient.name ?? "-"));
      setPatientNoInduk(String(patient.no_induk ?? "-"));
      setCaseStatus(String(data?.status ?? "-"));
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal memuat data kasus.");
    } finally {
      setLoading(false);
    }
  };

  const refreshQueue = async () => {
    if (!caseId) return;
    try {
      const res = await api.get(`/cases/${caseId}/images`);
      const images = Array.isArray((res.data as any)?.data) ? ((res.data as any).data as CaseImageSummary[]) : [];
      setQueue(images);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMsg(explainEndpointMissing());
      }
      setQueue([]);
    }
  };

  useEffect(() => {
    void refreshCase();
    void refreshQueue();
  }, [caseId]);

  const getPills = (img: CaseImageSummary) => {
    if (img.qc_status === "PASSED") return { status: "success", text: "Fokus Bagus" };
    return { status: "pending", text: "Pending" };
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) void handleFileUpload(e.dataTransfer.files);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!canUpload) return;
    setErrorMsg(null);
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    try {
      setLoading(true);
      const prepared = fileArr.map((f) => ({
        file: f,
        original_filename: sanitizeFilename(f.name),
        mime_type: inferMimeType(f),
      }));

      const requestBody = {
        images: prepared.map((p) => ({
          original_filename: p.original_filename,
          mime_type: p.mime_type,
          magnification,
          staining: "HE",
        })),
      };

      const presignedRes = await api.post(`/cases/${caseId}/images/presigned-urls`, requestBody);
      const items = Array.isArray((presignedRes.data as any)?.data) ? ((presignedRes.data as any).data as any[]) : [];

      if (items.length !== prepared.length) {
        throw new Error("Jumlah presigned URL tidak sesuai jumlah file yang diupload.");
      }

      await Promise.all(
        items.map(async (it, idx) => {
          const file = prepared[idx]?.file;
          const mime = prepared[idx]?.mime_type;
          if (!file || !mime) return;
          const url = String(it.presigned_url ?? "");
          if (!url) return;
          const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": mime },
            body: file,
          });
          if (!res.ok) throw new Error("Upload gagal.");
        }),
      );

      await refreshQueue();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMsg(explainEndpointMissing());
        return;
      }
      const messageFromApi =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      const messageFromError = err instanceof Error ? err.message : null;

      setErrorMsg(
        typeof messageFromApi === "string" && messageFromApi.length > 0
          ? messageFromApi
          : typeof messageFromError === "string" && messageFromError.length > 0
            ? messageFromError
            : "Gagal upload citra.",
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFile = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/images/${id}`);
      await refreshQueue();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal menghapus gambar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!caseId) return;
    setErrorMsg(null);
    try {
      setSubmitting(true);
      const imagesRes = await api.get(`/cases/${caseId}/images`);
      const images = Array.isArray((imagesRes.data as any)?.data) ? ((imagesRes.data as any).data as CaseImageSummary[]) : [];
      const pendingIds = images.filter((img) => img.qc_status === "PENDING").map((img) => img.id);

      if (pendingIds.length > 0) {
        await api.post(`/cases/${caseId}/images/confirm`, { image_ids: pendingIds });
      }

      await api.post(`/cases/${caseId}/submit`);
      navigate("/operator/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setErrorMsg(explainEndpointMissing());
        return;
      }
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal submit kasus.");
    } finally {
      setSubmitting(false);
      await refreshCase();
      await refreshQueue();
    }
  };

  const stats = useMemo(() => {
    const total = queue.length;
    const ready = queue.filter((q) => q.qc_status === "PASSED").length;
    return { total, ready };
  }, [queue]);

  return (
    <div className="min-h-screen bg-[#EEF6FF] font-sans text-slate-700 flex flex-col">
      <OperatorTopNav />

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 text-[#0a3d62]">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload size={24} />
              </div>
              <h2 className="text-2xl font-bold">Upload Citra</h2>
            </div>
            <div className="text-right text-xs">
              <p className="text-blue-700 font-bold">NIP: {patientNoInduk}</p>
              <p className="text-slate-500">
                Patient: <span className="font-bold text-slate-700">{patientName}</span>
              </p>
            </div>
          </div>

          {errorMsg ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Magnification
              </label>
              <div className="flex gap-6">
                {[
                  { label: "10x", value: "X10" as const },
                  { label: "40x", value: "X40" as const },
                ].map((val) => (
                  <label key={val.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mag"
                      checked={magnification === val.value}
                      onChange={() => setMagnification(val.value)}
                      className="w-4 h-4 text-blue-600"
                      disabled={!canUpload || loading || submitting}
                    />
                    <span className="text-sm font-medium">{val.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Case ID (Auto)
              </label>
              <input
                type="text"
                value={caseId ? `CASE-${caseId.slice(0, 8).toUpperCase()}` : ""}
                readOnly
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
              />
              <p className="mt-1 text-xs text-slate-400">Status: {loading ? "Loading..." : caseStatus}</p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => (canUpload ? fileInputRef.current?.click() : null)}
              className={`border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-white"}
                ${!canUpload ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Upload size={32} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Upload Citra</h3>
              <p className="text-sm text-slate-500 text-center px-10">
                Drag and drop pathology slides here or click to browse files
              </p>
              <div className="mt-6 flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>TIFF</span>
                <span>JPG</span>
                <span>PNG</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => (e.target.files ? void handleFileUpload(e.target.files) : null)}
                aria-label="Upload citra"
                accept=".tif,.tiff,.svs,image/tiff,image/jpeg,image/png"
                disabled={!canUpload || loading || submitting}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search size={20} className="text-blue-600" /> QC Queue
            </h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-[10px] font-bold uppercase">
                {stats.total} Total
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-[10px] font-bold uppercase">
                {stats.ready} Ready
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Quality</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Search size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400">Upload an image to see analysis begin</p>
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => {
                    const pill = getPills(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.original_filename}</td>
                        <td className="px-6 py-4">
                          <StatusPill status={pill.status} text={pill.text} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => void removeFile(item.id)}
                            className="text-red-400 hover:text-red-600 p-1 disabled:opacity-40"
                            aria-label="Remove file"
                            disabled={!canUpload || loading || submitting}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={!item.view_url}
                            onClick={() => (item.view_url ? window.open(item.view_url, "_blank", "noopener,noreferrer") : null)}
                            className="bg-[#0055CC] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-2 border border-[#0055CC] text-[#0055CC] font-bold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
            className={`px-8 py-2 rounded-lg font-bold text-white transition-all ${
              !canSubmit || submitting ? "bg-slate-300 cursor-not-allowed" : "bg-[#969696] hover:bg-slate-500"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Analysis"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function StatusPill({ status, text }: { status: string; text: string }) {
  const styles =
    {
      success: "bg-green-50 text-green-700 border-green-100",
      error: "bg-red-50 text-red-700 border-red-100",
      warning: "bg-orange-50 text-orange-700 border-orange-100",
      pending: "text-slate-400",
    }[status] || "text-slate-400";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${styles}`}>
      {status !== "pending" ? (
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-orange-500"
          }`}
        />
      ) : null}
      {text}
    </div>
  );
}
