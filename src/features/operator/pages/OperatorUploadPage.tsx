import { useState, useRef, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Search, Trash2
} from "lucide-react";
import OperatorTopNav from "../components/OperatorTopNav";

// Types for the Queue
interface QCItem {
  id: string;
  fileName: string;
  quality: "Fokus Bagus" | "Terlalu Blur" | "Foto Terlalu Gelap" | "Pending";
  status: "success" | "error" | "warning" | "pending";
}

export default function UploadCitra() {
  const navigate = useNavigate();
  const [magnification, setMagnification] = useState<"10x" | "40x">("10x");
  const [caseId, setCaseId] = useState("LAB-2023-9941");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Queue Data based on Image 14
  const [queue, setQueue] = useState<QCItem[]>([
    { id: "1", fileName: "IMG_3451.svs", quality: "Fokus Bagus", status: "success" },
    { id: "2", fileName: "IMG_3452.svs", quality: "Terlalu Blur", status: "error" },
    { id: "3", fileName: "IMG_3453.svs", quality: "Foto Terlalu Gelap", status: "warning" },
    { id: "4", fileName: "IMG_3454.svs", quality: "Pending", status: "pending" },
  ]);

  const handleFileUpload = (files: FileList) => {
    // Logic to add files to queue and trigger QC check
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(),
      fileName: file.name,
      quality: "Pending" as const,
      status: "pending" as const
    }));
    setQueue([...queue, ...newFiles]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] font-sans text-slate-700 flex flex-col">
      <OperatorTopNav />

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">

        {/* LEFT COLUMN: UPLOAD CONTROLS */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 text-[#0a3d62]">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload size={24} />
              </div>
              <h2 className="text-2xl font-bold">Upload Citra</h2>
            </div>
            <div className="text-right text-xs">
              <p className="text-blue-700 font-bold">NIP: 123108</p>
              <p className="text-slate-500">Patient: <span className="font-bold text-slate-700">Felicia</span></p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Magnification */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Magnification</label>
              <div className="flex gap-6">
                {["10x", "40x"].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mag"
                      checked={magnification === val}
                      onChange={() => setMagnification(val as "10x" | "40x")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium">{val}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Case ID */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Case ID (Auto)</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
              />
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
            >
              <Upload size={32} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Upload Citra</h3>
              <p className="text-sm text-slate-500 text-center px-10">
                Drag and drop pathology slides here or click to browse files
              </p>
              <div className="mt-6 flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>PNG</span><span>JPG</span><span>WEBP</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                aria-label="Upload citra"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QC QUEUE */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search size={20} className="text-blue-600" /> QC Queue
            </h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-[10px] font-bold uppercase">4 Total</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-[10px] font-bold uppercase">2 Ready</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Quality</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Search size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400">Upload an image to see analysis begin</p>
                    </td>
                  </tr>
                ) : queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.fileName}</td>
                    <td className="px-6 py-4">
                      <StatusPill status={item.status} text={item.quality} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        aria-label="Remove file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="bg-[#0055CC] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-blue-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
              <span className="text-slate-500 tracking-wider">Queue Status: 2 Sukses, 2 Gagal</span>
              <span className="text-blue-700">50% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500" style={{ width: '30%' }}></div>
              <div className="h-full bg-red-400" style={{ width: '20%' }}></div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-2 border border-[#0055CC] text-[#0055CC] font-bold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Back
            </button>
            <button
              disabled={queue.length === 0}
              className={`px-8 py-2 rounded-lg font-bold text-white transition-all
                ${queue.length > 0 ? "bg-[#969696] hover:bg-slate-500" : "bg-slate-300 cursor-not-allowed"}`}
            >
              Submit Analysis
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Component for the Status Tags
function StatusPill({ status, text }: { status: string, text: string }) {
  const styles = {
    success: "bg-green-50 text-green-700 border-green-100",
    error: "bg-red-50 text-red-700 border-red-100",
    warning: "bg-orange-50 text-orange-700 border-orange-100",
    pending: "text-slate-400",
  }[status] || "text-slate-400";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${styles}`}>
      {status !== 'pending' && <div className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-orange-500'}`} />}
      {text}
    </div>
  );
}
