import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type { ValidationRecord } from "../types/patolog.types";

export default function PendingValidationTable({ data }: { data: ValidationRecord[] }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
                <div className="flex gap-4 items-center w-full max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search Case ID or Patient..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                        <Filter size={18} /> Filters
                    </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Showing 1-6 of 6 records</span>
                    <div className="flex gap-1">
                        <button className="p-1 border rounded opacity-50"><ChevronLeft size={18} /></button>
                        <button className="p-1 border rounded"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <table className="w-full text-center border-collapse">
                <thead className="bg-[#0055CC] text-white text-xs uppercase tracking-wider font-bold">
                    <tr>
                        <th className="px-6 py-4">Case ID</th>
                        <th className="px-6 py-4">Patient Name</th>
                        <th className="px-6 py-4">Received</th>
                        <th className="px-6 py-4">Progress</th>
                        <th className="px-6 py-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-blue-600 font-bold text-sm">{item.caseId}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.patientName}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{item.received}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{item.progress.current}/{item.progress.total}</td>
                            <td className="px-6 py-4 text-sm">
                                <button className="bg-[#0055CC] text-white px-6 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-all">
                                    Validate
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}