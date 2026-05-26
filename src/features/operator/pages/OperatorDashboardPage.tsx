import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import OperatorEmptyState from "../components/OperatorEmptyState";
import PatientHistoryTable from "../components/PatientHistoryTable";
import OperatorTopNav from "../components/OperatorTopNav";
import { api } from "../../../services/api";
import type { PatientRecord } from "../types/operator.types";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OperatorDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState("");
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
      const res = await api.get("/cases", { params: { page: "1", limit: "200" } });
      const body = res.data as { data?: unknown };
      const items = Array.isArray((body as any).data) ? ((body as any).data as any[]) : [];

      const filtered = user?.id ? items.filter((c) => String(c.created_by ?? "") === user.id) : items;

      const mapped: PatientRecord[] = filtered.map((c) => {
        const id = String(c.id ?? "");
        const createdAt = String(c.created_at ?? new Date().toISOString());
        const patient = (c.patient ?? {}) as any;
        const patientId = String(patient.id ?? "");
        const patientName = String(patient.name ?? "-");
        const noInduk = patient.no_induk ? String(patient.no_induk) : undefined;

        return {
          id,
          caseId: `CASE-${id.slice(0, 8).toUpperCase()}`,
          patientId,
          patientNoInduk: noInduk,
          patientName,
          received: toRelative(createdAt),
          createdAt,
        };
      });

      setPatients(mapped);
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

  const filteredPatients = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return patients;

    return patients.filter(
      (item) =>
        item.caseId.toLowerCase().includes(keyword) ||
        item.patientName.toLowerCase().includes(keyword) ||
        (item.patientNoInduk?.toLowerCase().includes(keyword) ?? false),
    );
  }, [patients, query]);

  const handleBackToEmpty = () => {
    setPatients([]);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF]">
      <OperatorTopNav />
      <main className="max-w-[1260px] mx-auto px-4 py-4 md:px-6 md:py-6">
        {loading ? (
          <div className="text-sm text-slate-500 py-10">Loading...</div>
        ) : loadError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : patients.length === 0 ? (
          <OperatorEmptyState onLoadDemo={loadCases} />
        ) : (
          <PatientHistoryTable
            data={filteredPatients}
            query={query}
            onQueryChange={setQuery}
            onBack={handleBackToEmpty}
          />
        )}
      </main>
    </div>
  );
}
