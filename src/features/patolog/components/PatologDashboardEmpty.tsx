import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    BriefcaseMedical
} from "lucide-react";
import type { ValidationRecord } from "../types/patolog.types";

type Props = {
    data: ValidationRecord[];
    query: string;
    onQueryChange: (value: string) => void;
};

export default function PatologValidationTable({ data, query, onQueryChange }: Props) {
    const PAGE_SIZE = 6;
    const [page, setPage] = useState(1);

    // Logika Pagination
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const pagedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return data.slice(start, start + PAGE_SIZE);
    }, [data, page]);

    const startRecord = data.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endRecord = Math.min(page * PAGE_SIZE, data.length);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Header Tabel: Search & Pagination */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder="Cari ID Kasus atau Nama Pasien..."
                            className="h-10 w-72 pl-10 pr-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <button type="button" className="h-10 px-4 inline-flex items-center gap-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-600 transition-colors">
                        <Filter size={16} /> Filters
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing {startRecord}-{endRecord} of {data.length} records
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || data.length === 0}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Konten Tabel */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#0055CC] text-white text-xs uppercase font-bold text-center tracking-wider">
                        <tr>
                            <th className="py-4 px-6">ID Kasus</th>
                            <th className="py-4 px-6">Nama Pasien</th>
                            <th className="py-4 px-6">Tanggal Masuk</th>
                            <th className="py-4 px-6">Progress</th>
                            <th className="py-4 px-6">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-center divide-y divide-slate-100">
                        {data.length === 0 ? (
                            /* Tampilan Jika Data Kosong (Empty State) */
                            <tr>
                                <td colSpan={5} className="py-20">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="bg-slate-100 p-6 rounded-2xl mb-6">
                                            <BriefcaseMedical size={80} className="text-slate-400" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-medium text-slate-700 mb-2">
                                            Saat ini belum ada data kasus yang memerlukan validasi.
                                        </h3>
                                        <p className="text-slate-500">
                                            Silakan periksa kembali secara berkala
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            /* Render Baris Data Jika Ada */
                            pagedData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-[#0055CC] font-bold text-sm">
                                        {row.caseId}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                                        {row.patientName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {row.received}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm font-bold">
                                        {row.progress.current}/{row.progress.total}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/patolog/validate/${row.id}`}
                                            className="inline-flex items-center px-6 py-1.5 rounded-lg bg-[#0055CC] hover:bg-blue-700 text-white text-xs font-bold transition-all"
                                        >
                                            Validate
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}