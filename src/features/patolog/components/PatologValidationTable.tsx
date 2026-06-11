import React, { useMemo, useState, FC, Dispatch, SetStateAction } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ValidationRecord } from "../types/patolog.types";

type Props = {
    data: ValidationRecord[];
    query: string;
    onQueryChange: Dispatch<SetStateAction<string>>;
};

export default function PendingValidationTable({ data, query, onQueryChange }: Props) {
    const PAGE_SIZE = 6;
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pagedData = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return data.slice(start, start + PAGE_SIZE);
    }, [data, safePage]);

    const startRecord = data.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const endRecord = Math.min(safePage * PAGE_SIZE, data.length);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                onQueryChange(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search Case ID or Patient..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <Filter size={18} /> Filters
                    </button>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 text-xs md:text-sm text-slate-500 w-full md:w-auto">
                    <span>Showing {startRecord}-{endRecord} of {data.length} records</span>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="p-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages || data.length === 0}
                            className="p-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-center border-collapse">
                    <thead className="bg-[#0055CC] text-white text-xs uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-3 md:px-6 py-3 md:py-4">Case ID</th>
                            <th className="px-3 md:px-6 py-3 md:py-4">Patient Name</th>
                            <th className="px-3 md:px-6 py-3 md:py-4">Received</th>
                            <th className="px-3 md:px-6 py-3 md:py-4">Progress</th>
                            <th className="px-3 md:px-6 py-3 md:py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pagedData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 md:px-6 py-3 md:py-4 text-blue-600 font-bold text-sm">{item.caseId}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-600">{item.patientName}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-500">{item.received}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-slate-600">{item.progress.current}/{item.progress.total}</td>
                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm">
                                    <Link
                                        to={`/patolog/validate/${item.id}`}
                                        className="inline-flex bg-[#0055CC] text-white px-5 md:px-6 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                                    >
                                        Validate
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
