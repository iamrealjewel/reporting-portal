import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
    FileBox,
    Search,
    Download,
    Filter,
    Settings2,
    Clock,
    ChevronLeft,
    ChevronRight,
    X,
    CheckSquare,
    Square
} from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

interface HeaderFilterProps {
    label: string;
    column: string;
    filters: any;
    setFilters: (filters: any) => void;
    fetchSales: (page?: number, limit?: number, filters?: any) => void;
    options: any;
    openDropdown: string | null;
    setOpenDropdown: (column: string | null) => void;
    filterSearch: string;
    setFilterSearch: (search: string) => void;
}

const HeaderFilter = ({
    label,
    column,
    filters,
    setFilters,
    fetchSales,
    options,
    openDropdown,
    setOpenDropdown,
    filterSearch,
    setFilterSearch
}: HeaderFilterProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isSelected = (val: string) => Array.isArray(filters[column]) && filters[column].includes(val);
    const isOpen = openDropdown === column;

    const toggleSelection = (val: string) => {
        const current = (filters[column] as string[]) || [];
        const next = current.includes(val)
            ? current.filter(i => i !== val)
            : [...current, val];
        const newFilters = { ...filters, [column]: next, page: 1 };
        setFilters(newFilters);
    };

    const clearFilter = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const newFilters = { ...filters, [column]: [], page: 1 };
        setFilters(newFilters);
        setFilterSearch("");
        fetchSales(1, filters.limit, newFilters);
        setOpenDropdown(null);
    };

    const applyFilter = () => {
        fetchSales(1, filters.limit, filters);
        setOpenDropdown(null);
    };

    const currentOptions =
        column === "division" ? options.divisions :
            column === "depot" ? options.depots :
                column === "category" ? options.categories :
                    column === "brand" ? options.brands :
                        column === "prodLine" ? options.prodLines :
                            column === "seller" ? options.sellers :
                                column === "productCode" ? options.productCodes :
                                    column === "productName" ? options.productNames : [];

    const filteredOptions = (currentOptions || []).filter((opt: string) =>
        opt.toLowerCase().includes(filterSearch.toLowerCase())
    );

    const hasValue = Array.isArray(filters[column]) && filters[column].length > 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <TableHead className="py-4 px-3 min-w-[170px] align-top bg-slate-50/50 border-x border-slate-100/50 relative">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-1 group/head">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate">{label}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(isOpen ? null : column);
                                setFilterSearch("");
                            }}
                            className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-emerald-600 text-white shadow-lg' : hasValue ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-100'}`}
                        >
                            <Filter className="h-3.5 w-3.5" />
                        </button>
                        {hasValue && (
                            <button onClick={clearFilter} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <Input
                                    placeholder="Search options..."
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    className="h-9 text-[11px] pl-9 pr-2 font-medium border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar">
                                {filteredOptions.length > 0 ? filteredOptions.map((opt: string) => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleSelection(opt)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${isSelected(opt)
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                            : 'hover:bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-tight truncate">{opt}</span>
                                        {isSelected(opt) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-200" />}
                                    </button>
                                )) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">No options found</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                <Button
                                    onClick={applyFilter}
                                    className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
                                >
                                    Apply
                                </Button>
                                <Button
                                    onClick={clearFilter}
                                    variant="outline"
                                    className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest border-slate-200 text-slate-400 hover:bg-slate-50"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TableHead>
    );
};

export default function SalesReport() {
    const [sales, setSales] = useState<any[]>([]);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [filterSearch, setFilterSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [showColumnConfig, setShowColumnConfig] = useState(false);
    const configRef = useRef<HTMLDivElement>(null);
    const [meta, setMeta] = useState({
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
    });

    const [filters, setFilters] = useState<any>({
        startDate: "",
        endDate: "",
        productCode: [] as string[],
        productName: [] as string[],
        brand: [] as string[],
        division: [] as string[],
        depot: [] as string[],
        category: [] as string[],
        prodLine: [] as string[],
        seller: [] as string[],
        page: 1,
        limit: 100
    });

    const [options, setOptions] = useState({
        divisions: [] as string[],
        depots: [] as string[],
        categories: [] as string[],
        brands: [] as string[],
        prodLines: [] as string[],
        sellers: [] as string[],
        productCodes: [] as string[],
        productNames: [] as string[]
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { data } = await api.get("/sales/options");
                setOptions(data);
            } catch (err) {
                console.error("Failed to load filter options");
            }
        };
        fetchOptions();
    }, []);

    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        division: true,
        depot: true,
        seller: false,
        dbCode: false,
        dbName: true,
        prodLine: false,
        category: true,
        brand: true,
        productCode: true,
        productName: true,
        empId: false,
        employeeName: true,
        qtyPc: true,
        qtyLtrKg: false,
        dpValue: true,
        tpValue: true,
    });

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (configRef.current && !configRef.current.contains(event.target as Node)) {
                setShowColumnConfig(false);
            }
        };

        if (showColumnConfig) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showColumnConfig]);

    const fetchSales = async (pageOverride?: number, limitOverride?: number, filterOverride?: any) => {
        setLoading(true);
        try {
            const currentFilters = {
                ...(filterOverride || filters),
                page: pageOverride || (filterOverride ? filterOverride.page : filters.page),
                limit: limitOverride || (filterOverride ? filterOverride.limit : filters.limit)
            };
            const params = new URLSearchParams();
            Object.entries(currentFilters).forEach(([key, val]) => {
                if (val !== "" && val !== "ALL" && val !== null && val !== undefined) {
                    if (Array.isArray(val)) {
                        val.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, String(val));
                    }
                }
            });
            const { data } = await api.get(`/sales/report?${params.toString()}`);
            setSales(data.data);
            setMeta(data.meta);
            setHasSearched(true);
            if (data.data.length === 0) {
                toast.info("No sales records found for the selected filters.");
            }
        } catch (err) {
            toast.error("Failed to load sales data.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            toast.loading("Preparing export file...");
            // Fetch all data for this filter without pagination limits
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== "" && val !== "ALL" && val !== null && val !== undefined) {
                    if (Array.isArray(val)) {
                        val.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, String(val));
                    }
                }
            });
            params.set("page", "1");
            params.set("limit", "999999");

            const { data } = await api.get(`/sales/report?${params.toString()}`);
            const allData = data.data;

            if (allData.length === 0) {
                toast.error("No data to export.");
                return;
            }

            // Filter columns based on visibleColumns state
            const exportData = allData.map((item: any) => {
                const filtered: any = {};
                Object.entries(visibleColumns).forEach(([key, isVisible]) => {
                    if (isVisible) {
                        const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                        filtered[label] = item[key];
                    }
                });
                return filtered;
            });

            const { utils, writeFile } = await import("xlsx");
            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Sales Report");
            writeFile(wb, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Sales report exported successfully.");
        } catch (err) {
            toast.error("Export failed.");
        } finally {
            toast.dismiss();
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev: any) => ({ ...prev, page: newPage }));
        fetchSales(newPage);
    };

    const handleSearch = () => {
        setFilters((prev: any) => ({ ...prev, page: 1 }));
        fetchSales(1);
    };

    useEffect(() => {
        document.title = "Sales Report | DMS Portal";
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FileBox className="h-6 w-6 text-emerald-600" />
                        Distributor Sales Register
                    </h1>
                    <p className="text-slate-500 text-sm italic">Define reporting parameters and click search to sync the register.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={loading || !hasSearched}
                        className="h-10 border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-[#0F172A] hover:bg-slate-800 h-10 px-6 font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-sm text-white"
                    >
                        {loading ? "Syncing..." : hasSearched ? "Refresh" : "Search Sales"}
                    </Button>
                </div>
            </div>

            {hasSearched && (
                <div className="flex flex-row flex-wrap justify-between items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex flex-col shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">Pagination Strategy</span>
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <span>Showing {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)}</span>
                            <span className="text-slate-400 font-medium whitespace-nowrap">of {meta.total} records</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={meta.page <= 1 || loading}
                            onClick={() => handlePageChange(meta.page - 1)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 px-2">
                            <span className="text-xs font-bold text-emerald-600">Page {meta.page}</span>
                            <span className="text-xs text-slate-400">/ {meta.totalPages}</span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={meta.page >= meta.totalPages || loading}
                            onClick={() => handlePageChange(meta.page + 1)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <div className="h-6 w-px bg-slate-100 mx-1" />

                        <Select
                            value={String(filters.limit)}
                            onValueChange={(val) => {
                                setFilters((prev: any) => ({ ...prev, limit: Number(val), page: 1 }));
                                fetchSales(1, Number(val));
                            }}
                        >
                            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-50 transition-colors focus:ring-0 text-[10px] font-bold px-2 w-[100px]">
                                <SelectValue placeholder="Limit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50 / Page</SelectItem>
                                <SelectItem value="100">100 / Page</SelectItem>
                                <SelectItem value="250">250 / Page</SelectItem>
                                <SelectItem value="500">500 / Page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}


            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date Range</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">START</span>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="h-8 w-36 border-slate-200 text-[11px] bg-slate-50/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">END</span>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="h-8 w-36 border-slate-200 text-[11px] bg-slate-50/50"
                        />
                    </div>
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 px-6 text-white font-bold text-[10px] uppercase tracking-widest transition-all rounded-lg shadow-sm"
                >
                    <Search className="h-3.5 w-3.5 mr-2" />
                    Fetch Sales Data
                </Button>

                <div className="h-6 w-px bg-slate-100 hidden lg:block" />

                <div className="relative ml-auto">
                    <Button
                        variant="outline"
                        onClick={() => setShowColumnConfig(!showColumnConfig)}
                        className={`h-9 border-slate-200 font-bold text-[10px] uppercase tracking-widest rounded-lg px-4 ${showColumnConfig ? 'bg-emerald-600 text-white border-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Settings2 className="w-3.5 h-3.5 mr-2" />
                        Columns
                    </Button>

                    {showColumnConfig && (
                        <div
                            ref={configRef}
                            className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[110] animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <Settings2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visible Columns</span>
                                </div>
                                <div className="max-h-[350px] overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar">
                                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleColumn(key as any)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${isVisible
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'hover:bg-slate-50 text-slate-400'
                                                }`}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-tight truncate">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            {isVisible ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-200" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {hasSearched ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b-2 border-slate-100/50">
                                <TableRow>
                                    {visibleColumns.date && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6 min-w-[120px]">Date</TableHead>}
                                    {visibleColumns.division && <HeaderFilter label="Division" column="division" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.depot && <HeaderFilter label="Depot" column="depot" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.seller && <HeaderFilter label="Seller" column="seller" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.dbCode && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">DB Code</TableHead>}
                                    {visibleColumns.dbName && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">Distributor</TableHead>}
                                    {visibleColumns.prodLine && <HeaderFilter label="Line" column="prodLine" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.category && <HeaderFilter label="Category" column="category" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.brand && <HeaderFilter label="Brand" column="brand" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.productCode && <HeaderFilter label="SKU" column="productCode" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.productName && <HeaderFilter label="Product Name" column="productName" filters={filters} setFilters={setFilters} fetchSales={fetchSales} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.empId && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">Emp ID</TableHead>}
                                    {visibleColumns.employeeName && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">SR/SO Name</TableHead>}
                                    {visibleColumns.qtyPc && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Qty (PC)</TableHead>}
                                    {visibleColumns.qtyLtrKg && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Qty (Ltr/Kg)</TableHead>}
                                    {visibleColumns.dpValue && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6 text-right">DP Value</TableHead>}
                                    {visibleColumns.tpValue && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6 text-right">TP Value</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <FileBox className="h-12 w-12 opacity-20" />
                                                <p className="text-sm">No sales records found matching your filters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sales.map((sale) => (
                                        <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {visibleColumns.date && (
                                                <TableCell className="py-4 px-6 text-[10px] font-medium text-slate-600">
                                                    {new Date(sale.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </TableCell>
                                            )}
                                            {visibleColumns.division && <TableCell className="py-4 text-[10px] text-slate-500 uppercase">{sale.division}</TableCell>}
                                            {visibleColumns.depot && <TableCell className="py-4 text-[10px] text-slate-500 font-bold uppercase">{sale.depot}</TableCell>}
                                            {visibleColumns.seller && <TableCell className="py-4 text-[10px] text-slate-400">{sale.seller}</TableCell>}
                                            {visibleColumns.dbCode && <TableCell className="py-4 text-[10px] font-mono text-slate-400">{sale.dbCode}</TableCell>}
                                            {visibleColumns.dbName && <TableCell className="py-4 text-[10px] font-bold text-slate-700 uppercase">{sale.dbName}</TableCell>}
                                            {visibleColumns.prodLine && <TableCell className="py-4 text-[10px] text-slate-400">{sale.prodLine}</TableCell>}
                                            {visibleColumns.category && <TableCell className="py-4 text-[10px] text-slate-500">{sale.category}</TableCell>}
                                            {visibleColumns.brand && <TableCell className="py-4 text-[10px] font-bold text-emerald-600 uppercase">{sale.brand}</TableCell>}
                                            {visibleColumns.productCode && <TableCell className="py-4 text-[10px] font-mono font-bold text-slate-400">{sale.productCode}</TableCell>}
                                            {visibleColumns.productName && <TableCell className="py-4 text-[10px] font-bold text-slate-900">{sale.productName}</TableCell>}
                                            {visibleColumns.empId && <TableCell className="py-4 text-[10px] font-mono text-slate-400">{sale.empId}</TableCell>}
                                            {visibleColumns.employeeName && <TableCell className="py-4 text-[10px] font-bold text-slate-800 uppercase">{sale.employeeName}</TableCell>}
                                            {visibleColumns.qtyPc && (
                                                <TableCell className="py-4 text-[11px] font-bold text-slate-900">
                                                    {(sale.qtyPc || 0).toLocaleString()}
                                                </TableCell>
                                            )}
                                            {visibleColumns.qtyLtrKg && <TableCell className="py-4 text-[10px] text-slate-500">{(sale.qtyLtrKg || 0).toFixed(2)}</TableCell>}
                                            {visibleColumns.dpValue && <TableCell className="py-4 text-[10px] font-bold text-blue-600">৳{(sale.dpValue || 0).toLocaleString()}</TableCell>}
                                            {visibleColumns.tpValue && (
                                                <TableCell className="py-4 px-6 text-right text-[10px] font-bold text-slate-900">
                                                    ৳{(sale.tpValue || 0).toLocaleString()}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-slate-50/50 p-4 px-6 border-t border-slate-200 flex items-center justify-between font-bold text-[10px] uppercase tracking-widest text-slate-400">
                        <div className="flex gap-8">
                            <div className="flex flex-col">
                                <span className="mb-1">Page DP Total</span>
                                <span className="text-sm text-slate-900 font-bold tracking-tight leading-none">৳{sales.reduce((acc, curr) => acc + (curr.dpValue || 0), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-200 pl-8">
                                <span className="mb-1">Page TP Total</span>
                                <span className="text-sm text-slate-900 font-bold tracking-tight leading-none">৳{sales.reduce((acc, curr) => acc + (curr.tpValue || 0), 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Last Generated: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div >
            ) : (
                <div className="bg-emerald-50/20 border border-emerald-100 border-dashed rounded-2xl h-96 flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-emerald-50 flex items-center justify-center text-emerald-600 mb-6 animate-pulse">
                        <FileBox className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sales Register Inactive</h3>
                    <p className="text-slate-500 text-sm max-w-sm italic mb-8">
                        The register will not load data until you define filters and click "Search Sales". This helps maintain portal performance for large datasets.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-emerald-100 animate-pulse" />)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Awaiting Command...</span>
                    </div>
                </div>
            )
            }
        </div >
    );
}
