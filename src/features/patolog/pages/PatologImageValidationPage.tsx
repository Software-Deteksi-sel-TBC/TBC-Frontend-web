import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ZoomIn, X, ZoomOut } from "lucide-react";
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

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user?: { name: string };
};

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

// --- Options for Validation Form ---
const severityOptions: SeverityLevel[] = ["SANGAT_RENDAH", "RENDAH", "SEDANG", "TINGGI", "SANGAT_TINGGI"];
const countOptions: HpfCountLevel[] = ["TIDAK_ADA", "JARANG", "CUKUP_BANYAK", "SANGAT_BANYAK"];

// --- Helpers ---
const formatLabel = (v: string) => v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const severityBadge = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes("sangat tinggi") || key.includes("tinggi")) return "text-red-600";
  if (key.includes("sedang") || key.includes("cukup")) return "text-orange-600";
  return "text-green-600";
};

// Helpers: format enum agar tampil cantik di UI
const formatSeverity = (v: SeverityLevel) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const formatCountLevel = (v: HpfCountLevel) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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

  // State: loading, error halaman, comment
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

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
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for Processing
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form State untuk Validasi Dokter
  const [formData, setFormData] = useState({
    necrosis_severity: "SANGAT_RENDAH" as SeverityLevel,
    granuloma_severity: "SANGAT_RENDAH" as SeverityLevel,
    datia_count_level: "TIDAK_ADA" as HpfCountLevel,
    epithelioid_count_level: "TIDAK_ADA" as HpfCountLevel,
  });


  // Derived: label singkat umur & jenis kelamin
  const patientYearsLabel = typeof patientInfo.age === "number" ? `${patientInfo.age}Y` : "-";
  const patientGenderLabel = patientInfo.sex === "LAKI_LAKI" ? "M" : patientInfo.sex === "PEREMPUAN" ? "F" : "-";

  const fetchData = async () => {
    if (!caseId || !imageId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Ambil data WAJIB (Case & Detail Citra) tanpa komentar dulu
      const [caseRes, detailRes] = await Promise.all([
        api.get(`/cases/${caseId}`),
        api.get(`/review/cases/${caseId}/images/${imageId}`),
      ]);

      const kasus = caseRes.data?.data ?? {};
      const patient = kasus.patient ?? {};
      setPatientInfo({
        caseLabel: `LAB-${String(kasus.id).slice(0, 4).toUpperCase()}`,
        name: patient.name ?? "-",
        age: patient.age,
        sex: patient.sex,
      });

      const imgData = detailRes.data?.data ?? {};
      setDetail(imgData);

      // Prefill form modal
      setFormData({
        necrosis_severity: imgData.validation?.necrosis_severity ?? deriveSeverityFromPercent(imgData.ai_result?.total_necrosis_percent),
        granuloma_severity: imgData.validation?.granuloma_severity ?? deriveSeverityFromPercent(imgData.ai_result?.total_granuloma_percent),
        datia_count_level: imgData.validation?.datia_count_level ?? deriveCountLevel(imgData.ai_result?.total_datia_count),
        epithelioid_count_level: imgData.validation?.epithelioid_count_level ?? deriveCountLevel(imgData.ai_result?.total_epiteloid_count),
      });

      // 2. Ambil komentar secara TERPISAH (Agar jika 404, halaman tidak crash)
      try {
        const commentRes = await api.get(`/images/${imageId}/comments`);
        setComments(commentRes.data?.data ?? []);
      } catch (e) {
        console.warn("Endpoint komentar gagal (404/Not Found).");
      }

    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      setErrorMsg("Gagal memuat data utama dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [caseId, imageId]);

  const handleOpenModal = () => setIsModalOpen(true);

  const aiMetrics = useMemo(() => {
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
      setSubmitting(true);

      const payload = {
        global_severity: formData.necrosis_severity, // Biasanya global mengikuti tingkat necrosis
        necrosis_severity: formData.necrosis_severity,
        granuloma_severity: formData.granuloma_severity,
        datia_count_level: formData.datia_count_level,
        epithelioid_count_level: formData.epithelioid_count_level,
      } as const;

      await api.post(`/images/${imageId}/validate`, payload);
      setIsModalOpen(false);
      setActionMsg("Validasi berhasil disimpan.");
      fetchData();

    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
          ? (err.response.data as any).message
          : null;
      setActionMsg(typeof message === "string" && message.length > 0 ? message : "Gagal menyimpan validasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!imageId || !commentText.trim()) return;
    try {
      setSendingComment(true);

      // 1. Kirim ke Backend
      await api.post(`/images/${imageId}/comments`, { content: commentText.trim() });

      // 2. LOGIKA TAMBAHAN: Tambahkan komentar secara manual ke layar (Optimistic Update)
      const newCommentLocal = {
        id: Date.now().toString(), // ID sementara
        content: commentText.trim(),
        created_at: new Date().toISOString(),
      };

      // Update state comments secara manual agar langsung muncul di box riwayat
      setComments((prev) => [newCommentLocal, ...prev]);

      // 3. Reset form
      setCommentText("");
      setActionMsg("Komentar terkirim.");

      // 4. Tetap panggil fetchData untuk sinkronisasi jika backend sudah siap
      fetchData();

    } catch (err) {
      setActionMsg("Gagal kirim komentar.");
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
        diagnosis_summary: commentText.trim().length > 0 ? commentText.trim() : undefined,
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
                      {/* Necrosis */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Necrosis</span>
                        <span className="font-semibold text-slate-900">
                          {detail?.ai_result?.total_necrosis_percent !== null
                            ? `${Math.round(detail?.ai_result?.total_necrosis_percent ?? 0)}%`
                            : "-"}
                          {" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.necrosisSeverity)}`}>
                            {aiMetrics.necrosisSeverity}
                          </span>
                        </span>
                      </div>

                      {/* Datia Langhans */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Datia Langhans</span>
                        <span className="font-semibold text-slate-900">
                          {detail?.ai_result?.total_datia_count !== null
                            ? detail?.ai_result?.total_datia_count
                            : "-"}
                          {" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.datiaLevel)}`}>
                            {aiMetrics.datiaLevel}
                          </span>
                        </span>
                      </div>

                      {/* Granuloma */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Granuloma</span>
                        <span className="font-semibold text-slate-900">
                          {detail?.ai_result?.total_granuloma_percent !== null
                            ? `${Math.round(detail?.ai_result?.total_granuloma_percent ?? 0)}%`
                            : "-"}
                          {" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.granulomaSeverity)}`}>
                            {aiMetrics.granulomaSeverity}
                          </span>
                        </span>
                      </div>

                      {/* Epithelioid */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Epithelioid</span>
                        <span className="font-semibold text-slate-900">
                          {detail?.ai_result?.total_epiteloid_count !== null
                            ? detail?.ai_result?.total_epiteloid_count
                            : "-"}
                          {" "}
                          <span className={`ml-1 font-semibold ${severityBadge(aiMetrics.epiteloidLevel)}`}>
                            {aiMetrics.epiteloidLevel}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Tombol: Membuka Modal Validasi Dokter */}
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="w-full bg-[#0055CC] text-white py-2.5 font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Validasi
                    </button>

                    {/* Form: Diagnosis Comment & Riwayat */}
                    <div className="p-4 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-700 mb-2 uppercase">Diagnosis Comment</p>

                      {/* --- INI ADALAH BAGIAN RIWAYAT KOMENTAR --- */}
                      <div className="mb-3 max-h-[150px] overflow-y-auto space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {comments.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada riwayat komentar.</p>
                        ) : (
                          comments.map((c) => (
                            <div key={c.id} className="p-2 bg-white rounded border border-slate-200 shadow-sm text-xs">
                              <p className="text-slate-800 break-words">{c.content}</p>
                              <p className="text-[9px] text-slate-400 mt-1 text-right">
                                {new Date(c.created_at).toLocaleString('id-ID')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      {/* ------------------------------------------ */}

                      {/* Bagian Input (Kode Anda yang tadi) */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add comment..."
                          className="w-full min-h-[80px] p-3 text-sm outline-none resize-none"
                        />
                        <div className="p-2 bg-slate-50 flex justify-end">
                          <button
                            type="button"
                            disabled={sendingComment || commentText.trim().length === 0}
                            onClick={() => void handleSendComment()}
                            className="px-4 py-1.5 rounded bg-[#0055CC] text-white text-xs font-semibold hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
                          >
                            {sendingComment ? "Mengirim..." : "Kirim"}
                          </button>
                        </div>
                      </div>

                      {actionMsg && <p className="mt-2 text-[10px] text-slate-500 italic">{actionMsg}</p>}
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

      {/* --- MODAL VALIDASI (G-FORM STYLE) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Validasi Hasil Diagnosis</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {/* Question: Necrosis */}
              <section>
                <p className="font-semibold text-slate-700 mb-3">Tingkat Necrosis:</p>
                <div className="flex flex-wrap gap-4">
                  {severityOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="necrosis"
                        checked={formData.necrosis_severity === opt}
                        onChange={() => setFormData({ ...formData, necrosis_severity: opt })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm group-hover:text-blue-600 transition-colors">{formatLabel(opt)}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Question: Granuloma */}
              <section>
                <p className="font-semibold text-slate-700 mb-3">Tingkat Granuloma:</p>
                <div className="flex flex-wrap gap-4">
                  {severityOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="granuloma"
                        checked={formData.granuloma_severity === opt}
                        onChange={() => setFormData({ ...formData, granuloma_severity: opt })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm group-hover:text-blue-600">{formatLabel(opt)}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Question: Datia */}
              <section>
                <p className="font-semibold text-slate-700 mb-3">Jumlah Datia Langhans per HPF:</p>
                <div className="flex flex-wrap gap-4">
                  {countOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="datia"
                        checked={formData.datia_count_level === opt}
                        onChange={() => setFormData({ ...formData, datia_count_level: opt })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm group-hover:text-blue-600">{formatLabel(opt)}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Question: Epithelioid */}
              <section>
                <p className="font-semibold text-slate-700 mb-3">Jumlah Epithelioid per HPF:</p>
                <div className="flex flex-wrap gap-4">
                  {countOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="epithelioid"
                        checked={formData.epithelioid_count_level === opt}
                        onChange={() => setFormData({ ...formData, epithelioid_count_level: opt })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm group-hover:text-blue-600">{formatLabel(opt)}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded"
              >
                Batal
              </button>
              <button
                onClick={handleValidate}
                disabled={submitting}
                className="px-10 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-shadow shadow-md"
              >
                {submitting ? "Menyimpan..." : "Simpan Validasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
