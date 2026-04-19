import { useState, useRef, ChangeEvent, DragEvent, use } from "react";
import AuthLayout from "../layouts/AuthLayout";
import { Upload, Search, LogOut, User, ZoomIn, ZoomOut } from "lucide-react";



// Analysis Results with AI
interface AnalysisResults {
    quality: "GOOD" | "POOR";
    necrosis: number;
    granuloma: number;
    datiaLanghans: number;
}

export default function UploadCitra() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection logic
    const processFile = (selectedFile: File) => {
        const validTypes = ["image/png", "image/jpeg", "image/webp"];
        if (!validTypes.includes(selectedFile.type)) {
            alert("Please upload a valid image (PNG, JPG, or WEBP");
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));

        // Simulate AI Processing delay
        setTimeout(() => {
            setResults({
                quality: "GOOD",
                necrosis: 78,
                granuloma: 81,
                datiaLanghans: 28,
            });
        }, 1000);
    };

    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        id(e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>)
        => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewUrl(null);
        setResults(null);
    };

    return (
        <AuthLayout>
            <div className="min-h-screen bg [#f0f5fa] p-8 font-sans">
                {/* Top Navbar Simulation */}
                <div className="flex justify-end items-center gap-4 mb-6">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400"> Authorized User</p>
                        <p className="font-bold text-[#0a3d62]">jo</p>
                    </div>
                    <div className="w-10 h-10 bg white rounded-full flex items-center justify-center border border-slate-200">
                        <User size={20} className="text-slate-400" />
                    </div>
                    <LogOut size={20} className="text-[#0a3d62] cursor-pointer" />
                </div>
                {/* Main Interface */}
                <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-sm p-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text=[#0a3d62]">Image Analysis</h1>
                            <p className="text-slate-500 mt-1">Upload and analyse images for quality control.</p>
                        </div>
                        <div className="bg-[#eef5ff] text-[#0a3d62] px-6 py-2 rounded-full text-xs font-bold border border-blue-100">SYSTEM ACTIVE</div>
                    </div>
                    <hr className="my-8 border-slate-100" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT: DRAG & DROP ZONE */}
                        <div className="lg:col-span-7">
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => !file && fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-[2rem] h-[450px] transition-all flex flex-col items-center justify-center overflow-hidden 
                            ${isDragging ? "border-blue-600 bg-blue-50 scale-[1.01]" : "border-blue-400 bg-transparent"}}
                            ${!file ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}
                            `}
                            >
                                {previewUrl ? (
                                    <div className="text-center pointer-events-none">
                                        <div className="mb-4 inline-block p-4 rounded-2xl border border-slate-100">
                                            <Upload size={40} className="text-[#0a3d62]" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800">Drop your image here</h2>
                                        <p className="text-slate-400 mt-1 italic">or click to browse to your computer</p>
                                        <div className="mt-8 flex justify-center gap-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            <span>PNG</span><span>JPG</span><span>WEBP</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full p-6 flex flex-col">
                                        <img
                                            src={previewUrl}
                                            className="w-full h-full object-contain rounded-xl"
                                            alt="Uploaded Cell"
                                        />
                                        <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center">
                                            <div className="flex gap-4 text-slate-600 bg-white/80 p-2 rounded-lg backdrop-blur-sm">
                                                <ZoomOut size={20} className="cursor-pointer hover:text-blue-500" />
                                                <ZoomIn size={20} className="cursor-pointer hover:text-blue-500" />
                                            </div>
                                            <button
                                                onClick={handleClear}
                                                className="text-red-600 font-bold text-sm tracking-widest uppercase hover:underline"
                                            >
                                                Clear Image
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                            </div>
                        </div>
                        {/* RIGHT: ANALYSIS PANEL */}
                        <div className="lg:col-span-5 flex flex-col">
                            <h3 className="text-center text-slate-400 font-bold tracking-[0.2em] mb-8 uppercase text-sm">
                                AI Analysis
                            </h3>
                            {results ? (
                                <div className="space-y-6">
                                    {/* Quality Card */}
                                    <div className="bg-[#e4f9f0] p-6 rounded-xl border border-green-100">
                                        <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Quality Result</p>
                                        <p className="text-4xl font-black text-green-700">{results.quality}</p>
                                    </div>
                                    {/* Detection List */}
                                    <div className="border border-blue-400 rounded-2xl p-6 bg-white shadow-sm">
                                        <p className="text-[10px] font-bold text-blue-800 uppercase mb-4 tracking-wider">Detection Result</p>
                                        <div className="space-y-3">
                                            <div className="flex text-sm font-bold">
                                                <span className="text-slate-700 mr-1">Necrosis:</span>
                                                <span className="text-green-600">{results.necrosis}% Confidence</span>
                                            </div>
                                            <div className="flex text-sm font-bold">
                                                <span className="text-slate-700 mr-1">Granuloma:</span>
                                                <span className="text-green-600">{results.granuloma}% Confidence</span>
                                            </div>
                                            <div className="flex text-sm font-bold">
                                                <span className="text-slate-700 mr-1">Sel Datia Langhans:</span>
                                                <span className="text-red-600">{results.datiaLanghans}% Confidence</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                                    <div className="w-16 h-16 rounded-full border border-slate-100 flex items-center justify-center mb-4">
                                        <Search size={32} className="opacity-20" />
                                    </div>
                                    <p className="max-w-[180px] text-sm leading-relaxed">
                                        Upload an image to see analysis begin
                                    </p>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                className={`mt-10 w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all
                                    ${results
                                        ? "bg-[#0066cc] text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"}
                `}
                            >
                                Submit Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
