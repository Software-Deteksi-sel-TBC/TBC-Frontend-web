import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PatologTopNav from "../components/PatologTopNav";
import PendingValidationTable from "../components/PatologValidationTable";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import type { ValidationRecord } from "../types/patolog.types";

export default function PatologDashboardPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [pending, setPending] = useState<ValidationRecord[]>([]);
    const [query, setQuery] = useState("");
    const [pendingTotal, setPendingTotal] = useState(0);
    const [resolvedTotal, setResolvedTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const toRelative = (iso: string) => {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}h ago`;
        const diffD = Math.floor(diffH / 24);
        return diffD === 1 ? "Yesterday" : `${diffD}d ago`;
    };

    const loadCases = async () => {
        setLoadError(null);
        try {
            setLoading(true);
            const [pendingRes, resolvedRes] = await Promise.all([
                api.get("/review/queue", { params: { page: "1", limit: "200" } }),
                api.get("/review/resolved", { params: { page: "1", limit: "1" } }),
            ]);

            const pendingBody = pendingRes.data as any;
            const resolvedBody = resolvedRes.data as any;
            const pendingItems = Array.isArray(pendingBody?.data) ? (pendingBody.data as any[]) : [];
            const pendingMetaTotal = Number(pendingBody?.meta?.total ?? pendingItems.length ?? 0);
            const resolvedMetaTotal = Number(resolvedBody?.meta?.total ?? 0);

            const mapped: ValidationRecord[] = pendingItems.map((c) => {
                const id = String(c.id ?? "");
                const createdAt = String(c.created_at ?? new Date().toISOString());
                const imagesTotal = Number(c?.images_total ?? 0);
                const imagesValidated = Number(c?.images_validated ?? 0);
                const patientName = String(c?.patient?.name ?? "-");
                return {
                    id,
                    caseId: `LAB-${id.slice(0, 4).toUpperCase()}`,
                    patientName,
                    received: toRelative(createdAt),
                    progress: { current: imagesValidated, total: imagesTotal },
                };
            });

            setPending(mapped);
            setPendingTotal(pendingMetaTotal);
            setResolvedTotal(resolvedMetaTotal);
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
            setLoadError(typeof message === "string" && message.length > 0 ? message : "Gagal memuat data kasus.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCases();
    }, []);

    const filteredPending = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return pending;
        return pending.filter(
            (item) =>
                item.caseId.toLowerCase().includes(keyword) ||
                item.patientName.toLowerCase().includes(keyword),
        );
    }, [pending, query]);

    return (
        <div className="min-h-screen bg-[#EEF6FF]">
            <PatologTopNav /> {/* Gunakan nav yang sama */}

            <main className="max-w-[1260px] mx-auto px-4 py-6 md:px-6 md:py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0a3d62] mb-6 md:mb-8">Pending Validation Queue</h1>

                {/* Stats Cards */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-6 mb-6 md:mb-10">
                    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-full sm:w-60">
                        <div className="p-3 bg-blue-50 text-[#0055CC] rounded-lg"><ClipboardList size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pending</p>
                            <p className="text-2xl font-black text-slate-800">{pendingTotal}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-full sm:w-60">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved</p>
                            <p className="text-2xl font-black text-slate-800">{resolvedTotal}</p>
                        </div>
                    </div>
                </div>

                {/* The Table Component */}
                {loading ? (
                    <div className="text-sm text-slate-500 py-10">Loading...</div>
                ) : loadError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : (
                    <PendingValidationTable data={filteredPending} query={query} onQueryChange={setQuery} />
                )}
            </main>
        </div>
    );
}
