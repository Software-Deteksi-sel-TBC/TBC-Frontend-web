import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import PatologTopNav from "../components/PatologTopNav";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

// Enum values mengikuti Prisma enum di backend
type SeverityLevel =
  | "SANGAT_RENDAH"
  | "RENDAH"
  | "SEDANG"
  | "TINGGI"
  | "SANGAT_TINGGI";

// Level count per HPF mengikuti Prisma enum di backend
type HpfCountLevel = "TIDAK_ADA" | "JARANG" | "CUKUP_BANYAK" | "SANGAT_BANYAK";

// Shape data detail citra dari endpoint: GET /api/review/cases/:caseId/images/:imageId
type ReviewImageDetail = {
  id: string;
  original_filename: string;
  magnification: string;
  view_url: string | null;
  ai_result?: {
    global_severity?: SeverityLevel;
    total_necrosis_percent?: number | null;
    total_granuloma_percent?: number | null;
    total_datia_count?: number | null;
    total_epiteloid_count?: number | null;
  } | null;
  validation?: {
    global_severity: SeverityLevel;
    necrosis_severity: SeverityLevel;
    granuloma_severity: SeverityLevel;
    datia_count_level: HpfCountLevel;
    epithelioid_count_level: HpfCountLevel;
    validation_comment?: string | null;
  } | null;
};

// Helpers: format enum agar tampil cantik di UI
const formatSeverity = (v: SeverityLevel) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const formatCountLevel = (v: HpfCountLevel) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Helpers: warna label untuk severity/count di UI (indikasi visual)
const severityBadge = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes("sangat tinggi") || key.includes("tinggi")) return "text-red-600";
  if (key.includes("sedang") || key.includes("cukup")) return "text-orange-600";
  return "text-green-600";
};

// Helpers: fallback mapping dari angka AI → enum severity (hanya untuk prefill validasi)
const deriveSeverityFromPercent = (n: number | null | undefined): SeverityLevel => {
  const v = typeof n === "number" ? n : 0;
  if (v >= 80) return "SANGAT_TINGGI";
  if (v >= 60) return "TINGGI";
  if (v >= 40) return "SEDANG";
  if (v >= 20) return "RENDAH";
  return "SANGAT_RENDAH";
};

// Helpers: fallback mapping dari count AI → enum HPF count level (hanya untuk prefill validasi)
const deriveCountLevel = (n: number | null | undefined): HpfCountLevel => {
  const v = typeof n === "number" ? n : 0;
  if (v <= 0) return "TIDAK_ADA";
  if (v <= 2) return "JARANG";
  if (v <= 10) return "CUKUP_BANYAK";
  return "SANGAT_BANYAK";
};

export default function PatologImageValidationPage() {
  const { caseId, imageId } = useParams<{ caseId: string; imageId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // State: loading & error halaman
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State: data detail citra dan identitas pasien
  const [detail, setDetail] = useState<ReviewImageDetail | null>(null);
  const [patientInfo, setPatientInfo] = useState<{ caseLabel: string; name: string; age: number | null; sex: string | null }>({
    caseLabel: "-",
    name: "-",
    age: null,
    sex: null,
  });

  // State: UI interactions
  const [zoom, setZoom] = useState(1);
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [submittingValidation, setSubmittingValidation] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Derived: label singkat umur & jenis kelamin
  const patientYearsLabel = typeof patientInfo.age === "number" ? `${patientInfo.age}Y` : "-";
  const patientGenderLabel = patientInfo.sex === "LAKI_LAKI" ? "M" : patientInfo.sex === "PEREMPUAN" ? "F" : "-";

  useEffect(() => {
    // Fetch: detail kasus (untuk identitas pasien) + detail citra (untuk view_url, ai_result, validation, comments)
    const load = async () => {
      if (!caseId || !imageId) {
        setErrorMsg("Parameter caseId / imageId tidak ditemukan.");
        setLoading(false);
        return;
      }

      setErrorMsg(null);
      try {
        setLoading(true);
        const [caseRes, detailRes] = await Promise.all([
          api.get(`/cases/${caseId}`),
          api.get(`/review/cases/${caseId}/images/${imageId}`),
        ]);

        const kasus = (caseRes.data as any)?.data ?? {};
        const patient = (kasus.patient ?? {}) as any;

        setPatientInfo({
          caseLabel: `LAB-${String(kasus.id ?? caseId).slice(0, 4).toUpperCase()}`,
          name: String(patient.name ?? "-"),
          age: Number.isFinite(Number(patient.age)) ? Number(patient.age) : null,
          sex: typeof patient.sex === "string" ? patient.sex : null,
        });

        const data = (detailRes.data as any)?.data ?? {};
        setDetail({
          id: String(data.id ?? imageId),
          original_filename: String(data.original_filename ?? "-"),
          magnification: String(data.magnification ?? "-"),
          view_url: typeof data.view_url === "string" ? data.view_url : null,
          ai_result: data.ai_result ?? null,
          validation: data.validation ?? null,
        });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        const message =
          axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
            ? (err.response.data as any).message
            : null;
        setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal memuat detail citra.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [caseId, imageId]);

  const aiMetrics = useMemo(() => {
    // Mapping: ambil metrik AI yang relevan untuk ditampilkan di card "AI Metrics"
    const ai = detail?.ai_result ?? null;
    const necrosisPercent = typeof ai?.total_necrosis_percent === "number" ? ai.total_necrosis_percent : null;
    const granulomaPercent = typeof ai?.total_granuloma_percent === "number" ? ai.total_granuloma_percent : null;
    const datiaCount = typeof ai?.total_datia_count === "number" ? ai.total_datia_count : null;
    const epiteloidCount = typeof ai?.total_epiteloid_count === "number" ? ai.total_epiteloid_count : null;

    // Fallback label jika belum ada validation
    const necrosisSeverity = formatSeverity(deriveSeverityFromPercent(necrosisPercent));
    const granulomaSeverity = formatSeverity(deriveSeverityFromPercent(granulomaPercent));
    const datiaLevel = formatCountLevel(deriveCountLevel(datiaCount));
    const epiteloidLevel = formatCountLevel(deriveCountLevel(epiteloidCount));

    return {
      necrosisPercent,
      granulomaPercent,
      datiaCount,
      epiteloidCount,
      necrosisSeverity,
      granulomaSeverity,
      datiaLevel,
      epiteloidLevel,
    };
  }, [detail]);

  const handleValidate = async () => {
    // Submit: POST /api/images/:id/validate (upsert)
    if (!imageId) return;
    setActionMsg(null);
    try {
      setSubmittingValidation(true);

      const ai = detail?.ai_result ?? null;
      const existing = detail?.validation ?? null;

      const payload = {
        global_severity:
          existing?.global_severity ??
          (ai?.global_severity ?? deriveSeverityFromPercent(ai?.total_necrosis_percent ?? null)),
        necrosis_severity:
          existing?.necrosis_severity ?? deriveSeverityFromPercent(ai?.total_necrosis_percent ?? null),
        granuloma_severity:
          existing?.granuloma_severity ?? deriveSeverityFromPercent(ai?.total_granuloma_percent ?? null),
        datia_count_level:
          existing?.datia_count_level ?? deriveCountLevel(ai?.total_datia_count ?? null),
        epithelioid_count_level:
          existing?.epithelioid_count_level ?? deriveCountLevel(ai?.total_epiteloid_count ?? null),
      } as const;

      await api.post(`/images/${imageId}/validate`, payload);
      setActionMsg("Validasi berhasil disimpan.");

      if (caseId) {
        // Refresh: ambil ulang detail citra agar UI menampilkan validasi terbaru
        const detailRes = await api.get(`/review/cases/${caseId}/images/${imageId}`);
        const data = (detailRes.data as any)?.data ?? {};
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                view_url: typeof data.view_url === "string" ? data.view_url : prev.view_url,
                ai_result: data.ai_result ?? prev.ai_result,
                validation: data.validation ?? prev.validation,
              }
            : prev,
        );
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setActionMsg(typeof message === "string" && message.length > 0 ? message : "Gagal menyimpan validasi.");
    } finally {
      setSubmittingValidation(false);
    }
  };

  const handleSendComment = async () => {
    // Submit: POST /api/images/:id/comments
    if (!imageId) return;
    const content = comment.trim();
    if (!content) return;
    setActionMsg(null);
    try {
      setSendingComment(true);
      await api.post(`/images/${imageId}/comments`, { content });
      setComment("");
      setActionMsg("Komentar berhasil dikirim.");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setActionMsg(typeof message === "string" && message.length > 0 ? message : "Gagal mengirim komentar.");
    } finally {
      setSendingComment(false);
    }
  };

  const handleGeneratePdf = async () => {
    // Flow: create report -> get report -> open download_url
    if (!caseId) return;
    setActionMsg(null);
    try {
      setGenerating(true);
      const createRes = await api.post("/reports", {
        case_id: caseId,
        diagnosis_summary: comment.trim().length > 0 ? comment.trim() : undefined,
      });
      const reportId = String((createRes.data as any)?.data?.id ?? "");
      if (!reportId) {
        setActionMsg("Gagal generate report: ID report tidak ditemukan.");
        return;
      }
      const reportRes = await api.get(`/reports/${reportId}`);
      const url = (reportRes.data as any)?.data?.download_url;
      if (typeof url === "string" && url.length > 0) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setActionMsg("Report berhasil dibuat, tapi URL download tidak ditemukan.");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setActionMsg(typeof message === "string" && message.length > 0 ? message : "Gagal generate PDF.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF6FF] flex items-center justify-center text-slate-500">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6FF]">
      {/* Top Navigation */}
      <PatologTopNav />

      <main className="max-w-[1280px] mx-auto px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-32">
        {/* Header Halaman */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-5 md:mb-6">Detail Informasi Pasien</h1>

        {/* Card: Identitas Pasien */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-[#0055CC]">{patientInfo.caseLabel}</p>
            <p className="text-lg font-semibold text-slate-900">
              Patient: {patientInfo.name} ({patientYearsLabel}, {patientGenderLabel})
            </p>
          </div>
        </div>

        {/* Card: Detail Citra + Panel AI Metrics + Validasi */}
        <div className="mt-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          {/* Sub-header: nama file & magnification */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800">
              {detail?.original_filename ?? "-"} ({String(detail?.magnification ?? "-")} MAGNIFICATION)
            </p>
          </div>

          {errorMsg ? (
            /* State: error dari backend */
            <div className="px-4 py-6 text-sm text-red-700">{errorMsg}</div>
          ) : (
            <div className="p-4">
              {/* Layout Utama Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Kiri: Preview Citra */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100">
                      <div className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
                        {detail?.view_url ? (
                          <img
                            src={detail.view_url}
                            alt={detail.original_filename}
                            className="max-w-full max-h-full object-contain"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                          />
                        ) : (
                          <div className="text-sm text-slate-500 px-4 text-center">
                            Citra belum tersedia untuk ditampilkan.
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Toolbar: Zoom */}
                    <div className="p-3 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        aria-label="Zoom out"
                        onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
                        className="w-9 h-9 inline-flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label="Zoom in"
                        onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                        className="w-9 h-9 inline-flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50"
                      >
                        <ZoomIn size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Kanan: Citra analisis AI + aksi validasi + komentar */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {/* Header panel AI Metrics */}
                    <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055CC]">
                        <FileText size={16} />
                      </div>
                      <p className="font-semibold text-slate-800">AI Metrics</p>
                    </div>

                    {/* Konten AI Metrics */}
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Necrosis</span>
                        <span className="font-semibold text-slate-900">
                          {aiMetrics.necrosisPercent !== null ? `${Math.round(aiMetrics.necrosisPercent)}%` : "-"}{" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.necrosisSeverity)}`}>{aiMetrics.necrosisSeverity}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Datia Langhans</span>
                        <span className="font-semibold text-slate-900">
                          {aiMetrics.datiaCount !== null ? `${aiMetrics.datiaCount}` : "-"}{" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.datiaLevel)}`}>{aiMetrics.datiaLevel}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Granuloma</span>
                        <span className="font-semibold text-slate-900">
                          {aiMetrics.granulomaPercent !== null ? `${Math.round(aiMetrics.granulomaPercent)}%` : "-"}{" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.granulomaSeverity)}`}>{aiMetrics.granulomaSeverity}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Epithelioid</span>
                        <span className="font-semibold text-slate-900">
                          {aiMetrics.epiteloidCount !== null ? `${aiMetrics.epiteloidCount}` : "-"}{" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.epiteloidLevel)}`}>{aiMetrics.epiteloidLevel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Tombol: Submit validasi */}
                    <button
                      type="button"
                      disabled={submittingValidation}
                      onClick={() => void handleValidate()}
                      className="w-full bg-[#0055CC] text-white py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingValidation ? "Menyimpan..." : "Validasi"}
                    </button>

                    {/* Form: Diagnosis Comment */}
                    <div className="p-4 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-700 mb-2">DIAGNOSIS COMMENT</p>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add comment..."
                          className="w-full min-h-[90px] p-3 text-sm outline-none resize-none"
                        />
                        <div className="p-3 bg-slate-50 flex justify-end">
                          <button
                            type="button"
                            disabled={sendingComment || comment.trim().length === 0}
                            onClick={() => void handleSendComment()}
                            className="px-4 py-2 rounded bg-slate-300 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {sendingComment ? "Mengirim..." : "Kirim"}
                          </button>
                        </div>
                      </div>
                      {actionMsg ? (
                        <div className="mt-3 text-xs text-slate-600">{actionMsg}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Actions: navigasi & generate report */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/patolog/validate/${caseId ?? ""}`)}
          className="bg-white border border-[#0055CC] text-[#0055CC] px-6 py-2 rounded shadow-sm hover:bg-blue-50 transition-colors"
        >
          Kembali
        </button>
        <button
          type="button"
          disabled={generating || !caseId}
          onClick={() => void handleGeneratePdf()}
          className="bg-[#0055CC] text-white px-6 py-2 rounded shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}
