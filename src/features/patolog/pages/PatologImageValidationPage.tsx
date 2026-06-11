import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ZoomIn, X, ZoomOut, CheckCircle2 } from "lucide-react";
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
  const key = label.toUpperCase();
  // --- KATEGORI MERAH (Parah / Sangat Banyak) ---
  if (key.includes("SANGAT_TINGGI") || key.includes("SANGAT_BANYAK")) {
    return "text-red-600";
  }

  // --- KATEGORI ORANYE (Tinggi) ---
  if (key.includes("TINGGI")) {
    return "text-orange-600";
  }

  // --- KATEGORI KUNING/AMBER (Sedang / Cukup Banyak) ---
  if (key.includes("SEDANG") || key.includes("CUKUP_BANYAK")) {
    return "text-amber-500";
  }

  // --- KATEGORI HIJAU MUDA (Rendah / Jarang) ---
  if ((key.includes("RENDAH") && !key.includes("SANGAT")) || key.includes("JARANG")) {
    return "text-lime-600";
  }

  // --- KATEGORI HIJAU PEKAT (Sangat Rendah / Tidak Ada) ---
  // Ini mencakup "SANGAT_RENDAH" dan "TIDAK_ADA"
  return "text-emerald-600";
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

      const imgData = detailRes.data?.data ?? {};
      setDetail(imgData);

      setComments(imgData.comments ?? imgData.comment_thread ?? []);

      const kasus = caseRes.data?.data ?? {};
      const patient = kasus.patient ?? {};
      setPatientInfo({
        caseLabel: `LAB-${String(kasus.id).slice(0, 4).toUpperCase()}`,
        name: patient.name ?? "-",
        age: patient.age,
        sex: patient.sex,
      });

      // Prefill form modal
      setFormData({
        necrosis_severity: imgData.validation?.necrosis_severity ?? deriveSeverityFromPercent(imgData.ai_result?.total_necrosis_percent),
        granuloma_severity: imgData.validation?.granuloma_severity ?? deriveSeverityFromPercent(imgData.ai_result?.total_granuloma_percent),
        datia_count_level: imgData.validation?.datia_count_level ?? deriveCountLevel(imgData.ai_result?.total_datia_count),
        epithelioid_count_level: imgData.validation?.epithelioid_count_level ?? deriveCountLevel(imgData.ai_result?.total_epiteloid_count),
      });

    } catch (err) {
      console.error("Fetch Error:", err);
      setErrorMsg("Gagal memuat data. Periksa apakah ID di URL sudah benar.");
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
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      {/* Tombol Kembali di Sisi Kiri */}
                      <button
                        type="button"
                        onClick={() => navigate(`/patolog/validate/${caseId}`)}
                        className="px-8 py-2.5 bg-white border border-[#0055CC] text-[#0055CC] rounded-md font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
                      >
                        Kembali
                      </button>

                      {/* Tombol Generate PDF di Sisi Kanan */}
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          disabled={generating || !detail?.validation}
                          onClick={() => void handleGeneratePdf()}
                          className="px-8 py-2.5 bg-[#0055CC] text-white rounded-md font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
                        >
                          {generating ? "Generating..." : "Generate PDF"}
                        </button>

                        {/* Helper text agar dokter tahu kenapa tombol mati */}
                        {!detail?.validation && (
                          <span className="text-[10px] text-slate-400 italic font-medium">
                            *Lakukan validasi untuk generate PDF
                          </span>
                        )}
                      </div>
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
                    <div className="p-4 space-y-3 text-sm">
                      {/* Baris Necrosis */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Necrosis</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {Math.round(detail?.ai_result?.total_necrosis_percent ?? 0)}%
                          </span>
                          <span className={`font-black ${severityBadge(aiMetrics.necrosisSeverity)}`}>
                            {aiMetrics.necrosisSeverity}
                          </span>
                        </div>
                      </div>

                      {/* Baris Datia Langhans */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Datia Langhans</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {/* Jika backend hanya kirim jumlah sel, kita tampilkan jumlah tersebut sebagai 'persentase beban sel' */}
                            {detail?.ai_result?.total_datia_count ?? 0}%
                          </span>
                          <span className={`font-black ${severityBadge(aiMetrics.datiaLevel)}`}>
                            {aiMetrics.datiaLevel}
                          </span>
                        </div>
                      </div>

                      {/* Baris Granuloma */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Granuloma</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {Math.round(detail?.ai_result?.total_granuloma_percent ?? 0)}%
                          </span>
                          <span className={`font-black ${severityBadge(aiMetrics.granulomaSeverity)}`}>
                            {aiMetrics.granulomaSeverity}
                          </span>
                        </div>
                      </div>

                      {/* Baris Epithelioid */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-600">Epithelioid</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {detail?.ai_result?.total_epiteloid_count ?? 0}%
                          </span>
                          <span className={`font-black ${severityBadge(aiMetrics.epiteloidLevel)}`}>
                            {aiMetrics.epiteloidLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* --- SECTION BARU: VALIDATION RESULTS --- */}
                    <div className="border-t border-slate-200 bg-blue-50/30">
                      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle2 size={16} />
                        </div>
                        <p className="font-semibold text-slate-800">Hasil Validasi</p>
                      </div>

                      <div className="p-4 space-y-3 text-sm">
                        {!detail?.validation ? (
                          /* State jika dokter belum melakukan validasi */
                          <div className="py-2 text-center text-slate-400 italic text-[11px]">
                            Belum ada hasil validasi manual.
                          </div>
                        ) : (
                          /* Daftar Hasil Validasi Patolog */
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-600">Necrosis</span>
                              <span className={`font-black ${severityBadge(detail.validation.necrosis_severity)}`}>
                                {formatLabel(detail.validation.necrosis_severity)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-600">Datia Langhans</span>
                              <span className={`font-black ${severityBadge(detail.validation.datia_count_level)}`}>
                                {formatLabel(detail.validation.datia_count_level)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-600">Granuloma</span>
                              <span className={`font-black ${severityBadge(detail.validation.granuloma_severity)}`}>
                                {formatLabel(detail.validation.granuloma_severity)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-600">Epithelioid</span>
                              <span className={`font-black ${severityBadge(detail.validation.epithelioid_count_level)}`}>
                                {formatLabel(detail.validation.epithelioid_count_level)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* --- END OF SECTION --- */}

                    {/* Tombol: Membuka Modal Validasi Dokter */}
                    <div className="px-6 py-4">
                      <button
                        type="button"
                        onClick={handleOpenModal}
                        className="w-full bg-[#0055CC] text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Validasi
                      </button>
                    </div>

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