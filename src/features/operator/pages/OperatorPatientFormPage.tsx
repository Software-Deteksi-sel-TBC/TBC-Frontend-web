import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorTopNav from "../components/OperatorTopNav";
import { ChevronRight } from "lucide-react";
import axios from "axios";
import { api } from "../../../services/api";

export default function OperatorPatientFormPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        patientId: "",
        age: "",
        sex: "",
        bpjs: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const nik = formData.patientId.replace(/\D/g, "").slice(0, 16);
        if (!/^\d{16}$/.test(nik)) {
            setErrorMsg("NIK harus 16 digit angka.");
            return;
        }

        const age = Number(formData.age);
        if (!Number.isFinite(age)) {
            setErrorMsg("Umur harus berupa angka.");
            return;
        }

        try {
            setSubmitting(true);
            const patientPayload = {
                name: formData.fullName.trim(),
                no_induk: nik,
                sex: formData.sex,
                age,
                bpjs_number: formData.bpjs.trim() ? formData.bpjs.trim() : undefined,
            };

            const patientRes = await api.post("/patients", patientPayload);
            const patientId = String((patientRes.data as any)?.data?.id ?? "");
            if (!patientId) throw new Error("ID pasien tidak ditemukan dari response backend.");

            const caseRes = await api.post("/cases", {
                patient_id: patientId,
                notes: formData.notes.trim() ? formData.notes.trim() : undefined,
            });
            const caseId = String((caseRes.data as any)?.data?.id ?? "");
            if (!caseId) throw new Error("ID kasus tidak ditemukan dari response backend.");

            navigate(`/operator/upload?caseId=${encodeURIComponent(caseId)}`);
        } catch (err: unknown) {
            const message =
                axios.isAxiosError(err) && typeof err.response?.data === "object" && err.response?.data
                    ? (err.response.data as any).message
                    : null;
            setErrorMsg(typeof message === "string" && message.length > 0 ? message : "Gagal menyimpan data pasien.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#EEF6FF] font-sans text-slate-700">
            <OperatorTopNav />

            <main className="max-w-[1260px] mx-auto px-4 py-6">
                <form
                    id="operator-patient-form"
                    onSubmit={handleContinue}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200"
                >
                    {/* Form Header */}
                    <div className="bg-[#0055CC] text-white px-6 py-3 flex items-center gap-2 font-medium">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                        Data Pasien
                    </div>

                    <div className="p-8 space-y-8">
                        {errorMsg ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {errorMsg}
                            </div>
                        ) : null}
                        {/* Top Row: Name and ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Felicia"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">No. Induk Pasien</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 123108"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.patientId}
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={16}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            patientId: e.target.value.replace(/\D/g, "").slice(0, 16),
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* Middle Row: Age, Sex, BPJS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Age</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 18"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Sex</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    value={formData.sex}
                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                    required
                                >
                                    <option value="">Select Sex</option>
                                    <option value="LAKI_LAKI">LAKI-LAKI</option>
                                    <option value="PEREMPUAN">PEREMPUAN</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">BPJS</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 00000085555xxxx"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.bpjs}
                                    onChange={(e) => setFormData({ ...formData, bpjs: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Physical Metrics</span></div>
                        </div>

                        {/* Bottom Section: Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Notes (Optional)</label>
                            <textarea
                                rows={5}
                                placeholder="Enter any primary symptoms or intake observations..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-8 py-2.5 border border-[#0055CC] text-[#0055CC] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        form="operator-patient-form"
                        disabled={submitting}
                        className="px-8 py-2.5 bg-[#0055CC] text-white font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        {submitting ? "Saving..." : "Continue"} <ChevronRight size={18} />
                    </button>
                </div>
            </main>
        </div>
    );
}
