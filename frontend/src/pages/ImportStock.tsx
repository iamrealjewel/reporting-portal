import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Upload,
    CheckCircle2,
    Loader2,
    FileText,
    Info,
    ChevronRight,
    Package,
    Zap,
    Download
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ImportStock() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        document.title = "Import Stock | DMS Portal";
    }, []);

    const downloadTemplate = () => {
        const headers = [
            "Stock Date", "Division", "Site Name", "Dist. Code", "Source", "Party Name",
            "Group", "Category", "Brand", "Product SKU", "Product Name",
            "Batch Name", "Qty", "Retailer Price", "Dealer Price", "LTR/KG",
            "Retailer Amount", "Dealer Amount"
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stock Template");
        XLSX.writeFile(wb, "DMS_Stock_Import_Template.xlsx");
        toast.success("Stock template downloaded successfully.");
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please provide a valid stock ledger file.");
            return;
        }

        setLoading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Step 1: Upload and initiate import
            const { data } = await api.post("/stock/import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    // Upload progress (0-50%)
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 50) / (progressEvent.total || progressEvent.loaded)
                    );
                    setProgress(percentCompleted);
                },
            });

            const jobId = data.jobId;

            // Step 2: Poll for processing progress (50-100%)
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/jobs/status/${jobId}`);
                    const job = statusRes.data;

                    // Progress mapping: 0-100% from job is mapped to 50-100% on UI
                    const totalProgress = 50 + Math.round(job.progress / 2);
                    setProgress(totalProgress);

                    if (job.status === "COMPLETED") {
                        clearInterval(pollInterval);
                        toast.success(`Data Pipeline integrated ${job.processed} inventory records.`);
                        setFile(null);
                        setLoading(false);
                        setProgress(100);
                        setTimeout(() => setProgress(0), 2000);
                    } else if (job.status === "FAILED") {
                        clearInterval(pollInterval);
                        toast.error(job.errorMessage || "Processing failed.");
                        setLoading(false);
                        setProgress(0);
                    }
                } catch (pollErr) {
                    console.error("Polling error:", pollErr);
                    clearInterval(pollInterval);
                    setLoading(false);
                }
            }, 1000);

        } catch (err: any) {
            toast.error(err.response?.data?.error || "Pipeline Error: Transfer failed.");
            setProgress(0);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    Stock Ledger Integration
                </h1>
                <p className="text-slate-500 italic">Synchronize physical inventory with system records via bulk ledger ingestion.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 uppercase tracking-widest text-[11px]">
                                <Zap className="h-4 w-4 text-blue-500" />
                                Mass Data Entry Protocol
                            </CardTitle>
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                size="sm"
                                className="h-8 text-[9px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                            >
                                <Download className="h-3 w-3 mr-1.5" />
                                Template
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="relative group">
                                <input
                                    type="file"
                                    id="file-upload-stock"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                            setFile(selectedFile);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="file-upload-stock"
                                    className={`
                    flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer bg-slate-50/30
                    ${file ? "border-blue-200 bg-blue-50/20" : "border-slate-200 hover:border-blue-400 group-hover:bg-slate-50"}
                  `}
                                >
                                    <div className={`
                    h-20 w-20 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                    ${file ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-600"}
                  `}>
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <span className={`text-lg font-bold tracking-tight ${file ? "text-blue-700" : "text-slate-700"}`}>
                                        {file ? file.name : "Select Inventory Ledger"}
                                    </span>
                                    <p className="text-sm text-slate-400 mt-2 italic font-serif">Drag & Drop or Click to browse files</p>

                                    {file && (
                                        <div className="mt-4 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-blue-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Payload Verified
                                        </div>
                                    )}
                                </label>
                            </div>

                            <Button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100 text-base flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing Pipeline...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Execute Ingestion
                                    </>
                                )}
                            </Button>

                            {loading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span>Upload Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm bg-blue-600 text-white p-6 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 -mb-8 -mr-8 h-32 w-32 bg-white/10 rounded-full"></div>
                        <div className="relative z-10">
                            <Info className="h-8 w-8 mb-4 opacity-50" />
                            <h3 className="text-lg font-bold mb-2">Ingestion Rules</h3>
                            <ul className="space-y-3">
                                {[
                                    'Strict "Product SKU" check',
                                    "Quantities must be positive integers",
                                    "Duplicate Batch IDs will be merged",
                                    "Headers must match template exactly"
                                ].map((text) => (
                                    <li key={text} className="flex items-start gap-2 text-xs font-medium text-blue-50">
                                        <ChevronRight className="h-3 w-4 mt-0.5 shrink-0" />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border-slate-100 shadow-sm p-6 bg-white">
                        <h3 className="text-slate-900 font-bold mb-4 uppercase text-[10px] tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
                            <Package className="h-3 w-3 text-blue-500" />
                            Validated Headers
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Required Schema</p>
                                <p className="text-[11px] font-mono bg-slate-50 p-2 rounded text-slate-600 leading-relaxed text-xs">
                                    Stock Date, Division, Site Name, Dist. Code, Source, Party Name, Group, Category, Brand, Product SKU, Product Name, Batch Name, Qty, Retailer Price, Dealer Price, LTR/KG, Retailer Amount, Dealer Amount
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
