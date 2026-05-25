import PatologTopNav from "../components/PatologTopNav"; 
import PendingValidationTable from "../components/PatologValidationTable";
import { mockValidationQueue } from "../data/mockValidation";
import { ClipboardList, CheckCircle2 } from "lucide-react";

export default function PatologDashboardPage() {
    return (
        <div className="min-h-screen bg-[#EEF6FF]">
            <PatologTopNav /> {/* Gunakan nav yang sama */}

            <main className="max-w-[1260px] mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold text-[#0a3d62] mb-8">Pending Validation Queue</h1>

                {/* Stats Cards */}
                <div className="flex gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-60">
                        <div className="p-3 bg-blue-50 text-[#0055CC] rounded-lg"><ClipboardList size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pending</p>
                            <p className="text-2xl font-black text-slate-800">3</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-60">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved</p>
                            <p className="text-2xl font-black text-slate-800">3</p>
                        </div>
                    </div>
                </div>

                {/* The Table Component */}
                <PendingValidationTable data={mockValidationQueue} />
            </main>
        </div>
    );
}