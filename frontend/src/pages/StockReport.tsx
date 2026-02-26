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
    Package,
    Clock,
    Filter,
    Download,
    Search,
    Settings2,
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
    fetchStock: (page?: number, limit?: number, filters?: any) => void;
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
    fetchStock,
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
        fetchStock(1, filters.limit, newFilters);
        setOpenDropdown(null);
    };

    const applyFilter = () => {
        fetchStock(1, filters.limit, filters);
        setOpenDropdown(null);
    };

    const currentOptions =
        column === "division" ? options.divisions :
            column === "siteName" ? options.siteNames :
                column === "category" ? options.categories :
                    column === "brand" ? options.brands :
                        column === "prodLine" ? options.prodLines :
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
                            className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-blue-600 text-white shadow-lg' : hasValue ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
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
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                            : 'hover:bg-slate-50 text-slate-600'
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
                                    className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
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

export default function StockReport() {
    const [stock, setStock] = useState<any[]>([]);
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
        division: [] as string[],
        productCode: [] as string[],
        productName: [] as string[],
        siteName: [] as string[],
        prodLine: [] as string[],
        category: [] as string[],
        brand: [] as string[],
        startDate: "",
        endDate: "",
        page: 1,
        limit: 100
    });

    const [options, setOptions] = useState({
        divisions: [] as string[],
        prodLines: [] as string[],
        categories: [] as string[],
        brands: [] as string[],
        siteNames: [] as string[],
        productCodes: [] as string[],
        productNames: [] as string[]
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { data } = await api.get("/stock/options");
                setOptions(data);
            } catch (err) {
                console.error("Failed to load filter options");
            }
        };
        fetchOptions();
    }, []);

    const [visibleColumns, setVisibleColumns] = useState({
        stockDate: true,
        division: true,
        siteName: true,
        distCode: false,
        source: false,
        partyName: true,
        prodLine: false,
        category: true,
        brand: true,
        productCode: true,
        productName: true,
        batchName: true,
        qty: true,
        retailerPrice: false,
        dealerPrice: false,
        ltrKg: false,
        retailerAmount: false,
        dealerAmount: true,
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

    const fetchStock = async (pageOverride?: number, limitOverride?: number, filterOverride?: any) => {
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
            const { data } = await api.get(`/stock/report?${params.toString()}`);
            setStock(data.data);
            setMeta(data.meta);
            setHasSearched(true);
            if (data.data.length === 0) {
                toast.info("No records found for the selected filters.");
            }
        } catch (err) {
            toast.error("Failed to load stock data.");
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

            const { data } = await api.get(`/stock/report?${params.toString()}`);
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
                        // Create readable header from camelCase key
                        const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                        filtered[label] = item[key];
                    }
                });
                return filtered;
            });

            const { utils, writeFile } = await import("xlsx");
            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Stock Report");
            writeFile(wb, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Stock report exported successfully.");
        } catch (err) {
            toast.error("Export failed.");
        } finally {
            toast.dismiss();
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev: any) => ({ ...prev, page: newPage }));
        fetchStock(newPage);
    };

    const handleSearch = () => {
        setFilters((prev: any) => ({ ...prev, page: 1 }));
        fetchStock(1);
    };

    useEffect(() => {
        document.title = "Stock Report | DMS Portal";
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="h-6 w-6 text-blue-600" />
                        Inventory Stock Register
                    </h1>
                    <p className="text-slate-500 text-sm italic">Define filters and click search to load warehouse data.</p>
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
                        className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-sm text-white"
                    >
                        {loading ? "Loading..." : hasSearched ? "Refresh" : "Search Data"}
                    </Button>
                </div>
            </div>

            {hasSearched && (
                <div className="flex flex-row flex-wrap justify-between items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="flex flex-col shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-0.5">Pagination Strategy</span>
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
                            <span className="text-xs font-bold text-blue-600">Page {meta.page}</span>
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
                                fetchStock(1, Number(val));
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
                        <span className="text-[10px] font-bold text-slate-400">FROM</span>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="h-8 w-36 border-slate-200 text-[11px] bg-slate-50/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">TO</span>
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
                    className="h-9 bg-blue-600 hover:bg-blue-700 px-6 text-white font-bold text-[10px] uppercase tracking-widest transition-all rounded-lg shadow-sm"
                >
                    <Search className="h-3.5 w-3.5 mr-2" />
                    Fetch Stock Data
                </Button>

                <div className="h-6 w-px bg-slate-100 hidden lg:block" />

                <div className="relative ml-auto">
                    <Button
                        variant="outline"
                        onClick={() => setShowColumnConfig(!showColumnConfig)}
                        className={`h-9 border-slate-200 font-bold text-[10px] uppercase tracking-widest rounded-lg px-4 ${showColumnConfig ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
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
                                    <Settings2 className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visible Columns</span>
                                </div>
                                <div className="max-h-[350px] overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar">
                                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleColumn(key as any)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${isVisible
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'hover:bg-slate-50 text-slate-400'
                                                }`}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-tight truncate">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            {isVisible ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-200" />}
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
                            <TableHeader className="bg-slate-50/80 border-b-2 border-slate-100">
                                <TableRow>
                                    {visibleColumns.stockDate && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">Date</TableHead>}
                                    {visibleColumns.division && <HeaderFilter label="Division" column="division" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.siteName && <HeaderFilter label="Site Name" column="siteName" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.distCode && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">Dist. Code</TableHead>}
                                    {visibleColumns.source && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">Source</TableHead>}
                                    {visibleColumns.partyName && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-3">Party Name</TableHead>}
                                    {visibleColumns.prodLine && <HeaderFilter label="Product Line" column="prodLine" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.category && <HeaderFilter label="Category" column="category" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.brand && <HeaderFilter label="Brand" column="brand" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.productCode && <HeaderFilter label="SKU" column="productCode" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.productName && <HeaderFilter label="Product Name" column="productName" filters={filters} setFilters={setFilters} fetchStock={fetchStock} options={options} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} filterSearch={filterSearch} setFilterSearch={setFilterSearch} />}
                                    {visibleColumns.batchName && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Batch</TableHead>}
                                    {visibleColumns.qty && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Qty</TableHead>}
                                    {visibleColumns.retailerPrice && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">RP</TableHead>}
                                    {visibleColumns.dealerPrice && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">DP</TableHead>}
                                    {visibleColumns.ltrKg && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Ltr/Kg</TableHead>}
                                    {visibleColumns.retailerAmount && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Retailer Amt</TableHead>}
                                    {visibleColumns.dealerAmount && <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Dealer Amt</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stock.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Package className="h-12 w-12 opacity-20" />
                                                <p className="text-sm">No records found matching your filters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stock.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {visibleColumns.stockDate && (
                                                <TableCell className="py-4 px-6 text-[10px] font-medium text-slate-600">
                                                    {new Date(item.stockDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </TableCell>
                                            )}
                                            {visibleColumns.division && <TableCell className="py-4 text-[10px] font-bold text-slate-700 uppercase">{item.division}</TableCell>}
                                            {visibleColumns.siteName && <TableCell className="py-4 text-[10px] font-medium text-slate-600 uppercase">{item.siteName}</TableCell>}
                                            {visibleColumns.distCode && <TableCell className="py-4 text-[10px] font-mono text-slate-400">{item.distCode}</TableCell>}
                                            {visibleColumns.source && <TableCell className="py-4 text-[10px] text-slate-500 italic">{item.source}</TableCell>}
                                            {visibleColumns.partyName && <TableCell className="py-4 text-[10px] font-bold text-slate-800 uppercase">{item.partyName}</TableCell>}
                                            {visibleColumns.prodLine && <TableCell className="py-4 text-[10px] text-slate-500">{item.prodLine}</TableCell>}
                                            {visibleColumns.category && <TableCell className="py-4 text-[10px] text-slate-500">{item.category}</TableCell>}
                                            {visibleColumns.brand && <TableCell className="py-4 text-[10px] font-bold text-blue-600 uppercase">{item.brand}</TableCell>}
                                            {visibleColumns.productCode && <TableCell className="py-4 text-[10px] font-mono font-bold text-slate-400">{item.productCode}</TableCell>}
                                            {visibleColumns.productName && <TableCell className="py-4 text-[10px] font-bold text-slate-900">{item.productName}</TableCell>}
                                            {visibleColumns.batchName && <TableCell className="py-4 text-[10px] font-mono text-slate-500">{item.batchName}</TableCell>}
                                            {visibleColumns.qty && (
                                                <TableCell className="py-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200/50">
                                                        {(item.qty || 0).toLocaleString()}
                                                    </span>
                                                </TableCell>
                                            )}
                                            {visibleColumns.retailerPrice && <TableCell className="py-4 text-[10px] font-bold text-slate-600">৳{item.retailerPrice?.toLocaleString()}</TableCell>}
                                            {visibleColumns.dealerPrice && <TableCell className="py-4 text-[10px] font-bold text-slate-600">৳{item.dealerPrice?.toLocaleString()}</TableCell>}
                                            {visibleColumns.ltrKg && <TableCell className="py-4 text-[10px] text-slate-500 font-medium">{(item.ltrKg || 0).toFixed(2)}</TableCell>}
                                            {visibleColumns.retailerAmount && <TableCell className="py-4 text-[10px] font-bold text-emerald-600">৳{item.retailerAmount?.toLocaleString()}</TableCell>}
                                            {visibleColumns.dealerAmount && (
                                                <TableCell className="py-4 px-6 text-right text-[10px] font-bold text-slate-900">
                                                    ৳{(item.dealerAmount || 0).toLocaleString()}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-slate-50/50 p-4 px-6 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Dataset size: {stock.length} unique records matched.
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            <span>Last Fetch: {new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl h-96 flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Ready for Inventory Analysis?</h3>
                    <p className="text-slate-500 text-sm max-w-sm italic mb-8">
                        Select your parameters above and click "Search Data" to generate the stock register. By default, the system remains idle to save performance.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-50 bg-slate-200 animate-pulse" />)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data pipeline standby...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
