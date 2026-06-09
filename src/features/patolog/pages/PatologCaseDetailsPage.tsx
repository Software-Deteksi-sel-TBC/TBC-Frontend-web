import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PatologTopNav from "../components/PatologTopNav";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

interface PatientImageSpecimen {
    id: string;
    filename: string;
    validationStatus: "Tervalidasi" | "Menunggu Validasi";
    severity?: string | null;
    validatedBy?: string | null;
}

export default function PatologCaseDetailsPage() {
    const { id } = useParams<{id: string }>();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // State: info pasien dan daftar citra dalam 1 kasus
    const [patientInfo, setPatientInfo] = useState<{
        caseId: string;
        name: string;
        age: number | null;
        sex: string | null;
    }>({
        caseId: "-",
        name: "-",
        age: null,
        sex: null,
    });

    const [specimens, setSpecimens] = useState<PatientImageSpecimen[]>([]);

    useEffect(() => {
        const load = async () => {
            if (!id) {
                setErrorMsg("ID kasus tidak ditemukan.");
                setLoading(false);
                return;
            }

            setErrorMsg(null);
            try {
                setLoading(true);
                // Ambil detail kasus + identitas pasien
                const caseRes = await api.get(`/cases/${id}`);
                const kasus = (caseRes.data as any)?.data ?? {};
                const patient = (kasus.patient ?? {}) as any;

                const nextCaseId = `LAB-${String(kasus.id ?? id).slice(0, 4).toUpperCase()}`;
                setPatientInfo({
                    caseId: nextCaseId,
                    name: String(patient.name ?? "-"),
                    age: Number.isFinite(Number(patient.age)) ? Number(patient.age) : null,
                    sex: typeof patient.sex === "string" ? patient.sex : null,
                });

                // Ambil daftar citra untuk review (endpoint khusus patolog)
                const imagesRes = await api.get(`/review/cases/${id}/images`);
                const images = Array.isArray((imagesRes.data as any)?.data) ? ((imagesRes.data as any).data as any[]) : [];

                const toTitle = (value: string) =>
                    value
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                const mapped: PatientImageSpecimen[] = images.map((img) => ({
                    id: String(img.id ?? ""),
                    filename: String(img.original_filename ?? "-"),
                    validationStatus: Boolean(img.is_validated) ? "Tervalidasi" : "Menunggu Validasi",
                    severity: typeof img.global_severity === "string" ? toTitle(img.global_severity) : null,
                    validatedBy: typeof img.validated_by === "string" ? img.validated_by : null,
                }));

                setSpecimens(mapped);
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
                setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal memuat detail kasus.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [id]);

    const patientYearsLabel = typeof patientInfo.age === "number" ? `${patientInfo.age}Y` : "-";
    const patientGenderLabel =
        patientInfo.sex === "LAKI_LAKI" ? "M" : patientInfo.sex === "PEREMPUAN" ? "F" : "-";

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF6FF] flex items-center justify-center">
                <p className="text-sm font-semibold text-slate-500 animate-pulse">Memuat berkas citra pasien...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF6FF]">
            {/* Top Navigation */}
            <PatologTopNav />

            <main className="max-w-[1280px] mx-auto px-4 py-6 md:px-6 md:py-8">
                {/* Header Halaman */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-5 md:mb-6">Detail Informasi Pasien</h1>

                {/* Card: Identitas Pasien */}
                <div className="bg-white border border-slate-200 rounded-lg">
                    <div className="px-4 py-3">
                        <p className="text-xs font-bold text-[#0055CC]">{patientInfo.caseId}</p>
                        <p className="text-lg font-semibold text-slate-900">
                            Patient: {patientInfo.name} ({patientYearsLabel}, {patientGenderLabel})
                        </p>
                    </div>
                </div>

                {/* Tabel: Daftar Citra dalam 1 Kasus */}
                <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-center border-collapse">
                            {/* Table Header */}
                            <thead className="bg-[#0055CC] text-white text-xs md:text-sm font-semibold">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 md:py-4">Nama File</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4">Status Validasi</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4">Derajat Keparahan</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4">Tervalidasi Oleh</th>
                                    <th className="px-3 md:px-6 py-3 md:py-4">Aksi</th>
                                </tr>
                            </thead>
                            {/* Table Body */}
                            <tbody className="divide-y divide-slate-100">
                                {errorMsg ? (
                                    /* State: error dari backend */
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-sm text-red-700">
                                            {errorMsg}
                                        </td>
                                    </tr>
                                ) : specimens.length === 0 ? (
                                    /* State: belum ada citra pada kasus ini */
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-sm text-slate-500">
                                            Belum ada citra untuk kasus ini.
                                        </td>
                                    </tr>
                                ) : (
                                    /* State: render baris citra */
                                    specimens.map((specimen) => {
                                        const isValidated = specimen.validationStatus === "Tervalidasi";
                                        const statusClass = isValidated
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700";

                                        const severityLabel = specimen.severity ?? "";
                                        const severityClass =
                                            severityLabel === "Sangat Tinggi"
                                                ? "bg-red-100 text-red-700"
                                                : severityLabel === "Normal"
                                                    ? "bg-slate-200 text-slate-700"
                                                    : "";

                                        return (
                                            <tr key={specimen.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-700">{specimen.filename}</td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm">
                                                    {/* Badge: status validasi */}
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                                        {specimen.validationStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm">
                                                    {/* Badge: derajat keparahan (dari AI / validasi) */}
                                                    {severityLabel ? (
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${severityClass}`}>
                                                            {severityLabel}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-600">{specimen.validatedBy ?? "-"}</td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm">
                                                    {/* Action: masuk ke halaman validasi citra */}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/patolog/validate/${id}/image/${specimen.id}`)}
                                                        className="bg-[#0055CC] text-white px-5 md:px-6 py-1.5 rounded font-semibold hover:bg-blue-700 transition-all"
                                                    >
                                                        Lihat
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

            {/* Floating Action: kembali ke dashboard */}
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6">
                <button
                    type="button"
                    onClick={() => navigate("/patolog/dashboard")}
                    className="bg-white border border-[#0055CC] text-[#0055CC] px-6 py-2 rounded shadow-sm hover:bg-blue-50 transition-colors"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
}
