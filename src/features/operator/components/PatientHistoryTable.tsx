import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { PatientRecord } from "../types/operator.types";

type Props = {
  data: PatientRecord[];
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
};

export default function PatientHistoryTable({
  data,
  query,
  onQueryChange,
  onBack,
}: Props) {
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data.length, query]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [data, safePage]);

  const startRecord = data.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(safePage * PAGE_SIZE, data.length);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-xs text-[#0A52D6] font-semibold hover:underline"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-3xl font-semibold text-[#0A52D6]">Patient History</h1>
          <p className="text-sm text-slate-500">
            Review and manage registered lab records.
          </p>
        </div>
        <Link
          to="/operator/upload"
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A52D6] hover:bg-blue-700 text-white rounded text-xs font-semibold"
        >
          <Plus size={14} />
          Register New Patient
        </Link>
      </div>

      <div className="mt-4 bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search Case ID or Patient..."
                className="h-9 w-64 pl-8 pr-3 text-sm border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="button"
              className="h-9 px-3 inline-flex items-center gap-2 text-sm border border-slate-200 rounded hover:bg-slate-50"
            >
              <Filter size={14} />
              Filters
            </button>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              Showing {startRecord} - {endRecord} of {data.length} records
            </p>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous page"
              disabled={safePage === 1}
              className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next page"
              disabled={safePage === totalPages || data.length === 0}
              className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#0A52D6] text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left py-3 px-4">Case ID</th>
                <th className="text-left py-3 px-4">Patient Name</th>
                <th className="text-left py-3 px-4">Received</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map((row) => (
                <tr key={`${row.caseId}-${row.createdAt}`} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-[#0A52D6] font-medium text-sm">{row.caseId}</td>
                  <td className="px-4 py-3 text-slate-700 text-sm">{row.patientName}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{row.received}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/operator/upload"
                      className="inline-flex items-center px-3 py-1.5 rounded bg-[#0A52D6] hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
