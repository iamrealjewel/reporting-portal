import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
    Filter,
    RefreshCw,
    PlusCircle,
    ChevronRight,
    Download,
    X,
    Layers,
    Calendar,
    TrendingUp,
    Star,
    PanelLeftClose,
    PanelLeftOpen,
    GripVertical,
    ChevronLeft,
    ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-filter";
import { utils, writeFile } from "xlsx";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableDimensionItem({ id, label, index, onRemove, activeDimensionsLength }: { id: string, label: string, index: number, onRemove: (id: string) => void, activeDimensionsLength: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-1.5 group relative">
            <div className={`flex-1 ${isDragging ? 'bg-blue-100/80 shadow-md ring-1 ring-blue-300' : 'bg-blue-50/40'} text-slate-600 px-3 py-1.5 rounded-lg flex items-center justify-between border border-blue-100 shadow-sm transition-all`}>
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-blue-300 hover:text-blue-500 transition-colors -ml-1 pr-1">
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-black">{index + 1}</span>
                    {label}
                </span>
            </div>
            {activeDimensionsLength > 1 && (
                <button
                    onClick={() => onRemove(id)}
                    className="h-7 w-7 rounded-lg border-slate-200 border flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

export default function SalesSummaries() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [dimensions, setDimensions] = useState<string[]>(
        searchParams.get("dims")?.split(",") || ["division"]
    );
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<any>(null);
    const [fetchingOptions, setFetchingOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isPredefinedOpen, setIsPredefinedOpen] = useState(true);
    const [isCustomOpen, setIsCustomOpen] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Filters State
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        brand: [] as string[],
        division: [] as string[],
        category: [] as string[],
        depot: [] as string[],
        prodLine: [] as string[],
        seller: [] as string[],
        employeeName: [] as string[],
        dbName: [] as string[],
        productName: [] as string[]
    });

    useEffect(() => {
        const dimsInUrl = searchParams.get("dims")?.split(",");
        if (dimsInUrl && JSON.stringify(dimsInUrl) !== JSON.stringify(dimensions)) {
            setDimensions(dimsInUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        document.title = `Sales Ledger Analytics | DMS Portal`;
        setSearchQuery("");
        setCurrentPage(1); // Reset page on filter/dimension change
        if (isFilterApplied()) {
            fetchSummary();
        } else {
            setData([]);
        }
    }, [dimensions, filters]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setDimensions((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);

                const newItems = arrayMove(items, oldIndex, newIndex);
                updateDims(newItems);
                return newItems;
            });
        }
    };

    const fetchOptions = async () => {
        setFetchingOptions(true);
        try {
            const { data } = await api.get("/analytics/filter-options");
            setOptions(data);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.message === 'Request aborted') return;
            toast.error("Failed to load filter metadata.");
        } finally {
            setFetchingOptions(false);
        }
    };

    const isFilterApplied = () => {
        return !!(
            filters.startDate ||
            filters.endDate ||
            filters.brand.length > 0 ||
            filters.division.length > 0 ||
            filters.category.length > 0 ||
            filters.depot.length > 0 ||
            filters.prodLine.length > 0 ||
            filters.seller.length > 0 ||
            filters.employeeName.length > 0 ||
            filters.dbName.length > 0 ||
            filters.productName.length > 0
        );
    };

    const fetchSummary = async () => {
        if (!isFilterApplied()) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("dimensions", dimensions.join(","));
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length > 0) {
                    params.append(key, value.join(","));
                }
            });

            const { data } = await api.get(`/analytics/sales-summary?${params.toString()}`);
            setData(data);
        } catch (error) {
            toast.error("Failed to fetch summary data.");
        } finally {
            setLoading(false);
        }
    };

    const toggleDimension = (dim: string) => {
        let newDims = [...dimensions];
        if (newDims.includes(dim)) {
            newDims = newDims.filter(d => d !== dim);
        } else {
            if (newDims.length >= 4) {
                toast.error("Maximum 4 levels allowed.");
                return;
            }
            newDims.push(dim);
        }
        if (newDims.length === 0) newDims = ["division"];
        updateDims(newDims);
    };

    const updateDims = (newDims: string[]) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("dims", newDims.join(","));
        setSearchParams(newParams);
        setDimensions(newDims);
    };

    const setFavorite = (dims: string[]) => {
        updateDims(dims);
        toast.info(`Switched to ${dims.join(" > ")} matrix`);
    };

    const resetFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            brand: [],
            division: [],
            category: [],
            depot: [],
            prodLine: [],
            seller: [],
            employeeName: [],
            dbName: [],
            productName: []
        });
    };

    const handleExport = () => {
        if (data.length === 0) return;
        setLoading(true);
        try {
            const exportData = data.map(item => {
                const row: any = {};
                dimensions.forEach(dim => {
                    const label = activeDimensionsOptions.find(o => o.value === dim)?.label || dim.toUpperCase();
                    row[label] = item[dim] || "N/A";
                });
                row["NET QUANTITY"] = item._sum?.qtyPc || 0;
                row["DP VALUE"] = item._sum?.dpValue || 0;
                row["TP VALUE"] = item._sum?.tpValue || 0;
                return row;
            });

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Sales Summary");
            writeFile(wb, `sales_summary_by_${dimensions.join("_")}.xlsx`);
            toast.success("Report exported successfully.");
        } catch (error) {
            toast.error("Export failed.");
        } finally {
            setLoading(false);
        }
    };

    const activeDimensionsOptions = [
        { label: "Division", value: "division" },
        { label: "Depot", value: "depot" },
        { label: "Product Line", value: "prodLine" },
        { label: "Category", value: "category" },
        { label: "Brand", value: "brand" },
        { label: "Product", value: "productName" },
        { label: "Seller", value: "seller" },
        { label: "Employee", value: "employeeName" },
        { label: "DB Name", value: "dbName" },
    ];

    const favorites = [
        { name: "Division by Brand", dims: ["division", "brand"] },
        { name: "Division by Prod Line", dims: ["division", "prodLine"] },
        { name: "Brand by Division", dims: ["brand", "division"] },
        { name: "Category by Division", dims: ["category", "division"] },
    ];

    return (
        <div className="space-y-6 pb-12 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="h-10 w-10 shrink-0 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hidden lg:flex"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-emerald-600" />
                            Sales Analytical Summaries
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 italic">Multi-level cross-tab aggregation and valuation reports for Sales.</p>
                    </div>
                </div>
            </div>

            {/* Global Filter Bar */}
            <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex flex-wrap items-center gap-2 overflow-visible sticky top-0 z-50">
                <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e: any) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        className="h-7 w-32 text-[10px] font-bold border-none bg-transparent focus-visible:ring-0 p-0"
                    />
                    <span className="text-slate-300 font-bold px-1">to</span>
                    <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e: any) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        className="h-7 w-32 text-[10px] font-bold border-none bg-transparent focus-visible:ring-0 p-0"
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

                <MultiSelectFilter
                    label="Division"
                    selectedValues={filters.division}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, division: vals }))}
                    options={options?.sales?.divisions}
                />
                <MultiSelectFilter
                    label="Depot"
                    selectedValues={filters.depot}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, depot: vals }))}
                    options={options?.sales?.depots}
                />
                <MultiSelectFilter
                    label="Prod Line"
                    selectedValues={filters.prodLine}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, prodLine: vals }))}
                    options={options?.sales?.prodLines}
                />
                <MultiSelectFilter
                    label="Category"
                    selectedValues={filters.category}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, category: vals }))}
                    options={options?.sales?.categories}
                />
                <MultiSelectFilter
                    label="Brand"
                    selectedValues={filters.brand}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, brand: vals }))}
                    options={options?.sales?.brands}
                />
                <MultiSelectFilter
                    label="Product"
                    selectedValues={filters.productName}
                    onChange={(vals: string[]) => setFilters(f => ({ ...f, productName: vals }))}
                    options={options?.sales?.products}
                />

                <div className="flex items-center gap-1 ml-auto">
                    {fetchingOptions && <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin mr-2" />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetFilters}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className={`space-y-4 transition-all duration-300 ease-in-out transform origin-left ${isSidebarOpen ? 'lg:col-span-1 opacity-100 translate-x-0' : 'hidden opacity-0 -translate-x-full w-0 overflow-hidden'}`}>
                    {/* Favorites Matrix */}
                    <Card className="rounded-2xl border-slate-200 border shadow-sm">
                        <CardHeader
                            className="bg-emerald-50/30 border-b border-slate-100 p-4 cursor-pointer hover:bg-emerald-50 transition-colors"
                            onClick={() => setIsPredefinedOpen(!isPredefinedOpen)}
                        >
                            <CardTitle className="text-xs font-black uppercase tracking-tighter text-emerald-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="h-3 w-3" />
                                    Predefined Matrix
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isPredefinedOpen ? 'rotate-180' : ''}`} />
                            </CardTitle>
                        </CardHeader>
                        <div className={`grid transition-all duration-300 ease-in-out ${isPredefinedOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <CardContent className="p-3 space-y-1">
                                    {favorites.map((fav) => (
                                        <button
                                            key={fav.name}
                                            onClick={() => setFavorite(fav.dims)}
                                            className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-between group"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{fav.name}</span>
                                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </CardContent>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 border shadow-sm">
                        <CardHeader
                            className="bg-slate-50/50 border-b border-slate-100 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setIsCustomOpen(!isCustomOpen)}
                        >
                            <CardTitle className="text-xs font-black uppercase tracking-tighter text-slate-500 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-3 w-3" />
                                    Custom Hierarchy
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isCustomOpen ? 'rotate-180' : ''}`} />
                            </CardTitle>
                        </CardHeader>
                        <div className={`grid transition-all duration-300 ease-in-out ${isCustomOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <CardContent className="p-4 space-y-2">
                                    <div className="mb-4 space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 px-1">Active Path</p>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="space-y-1.5">
                                                <SortableContext
                                                    items={dimensions}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {dimensions.map((dim, idx) => {
                                                        const label = activeDimensionsOptions.find(o => o.value === dim)?.label || dim;
                                                        return (
                                                            <SortableDimensionItem
                                                                key={dim}
                                                                id={dim}
                                                                label={label}
                                                                index={idx}
                                                                onRemove={toggleDimension}
                                                                activeDimensionsLength={dimensions.length}
                                                            />
                                                        );
                                                    })}
                                                </SortableContext>
                                            </div>
                                        </DndContext>
                                    </div>
                                    <div className="h-px bg-slate-100 mx-1 mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Add Dimensions</p>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                        {activeDimensionsOptions.filter(opt => !dimensions.includes(opt.value)).map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => toggleDimension(opt.value)}
                                                className="w-full text-left px-3 py-2 rounded-lg border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 group transition-all flex items-center justify-between"
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                                                <PlusCircle className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 border shadow-sm bg-slate-900 text-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Download className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Output</p>
                                    <p className="text-xs font-bold">Export Excel</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleExport}
                                disabled={loading || data.length === 0}
                                className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11"
                            >
                                {loading ? "Processing..." : "Download Excel"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className={`${isSidebarOpen ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-4 transition-all duration-300`}>
                    {isFilterApplied() && !loading && (
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative group w-full md:w-[30%] shrink-0">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder={`Search in results...`}
                                    value={searchQuery}
                                    onChange={(e: any) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="pl-11 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-xs font-bold uppercase tracking-widest placeholder:text-slate-400 w-full"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCurrentPage(1);
                                        }}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {data.length > 0 && (
                                <div className="w-full md:w-[70%] bg-white border border-slate-200 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm h-12 px-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap hidden xl:block">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.filter(item => {
                                            const combinedString = dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ");
                                            return combinedString.includes(searchQuery.toLowerCase());
                                        }).length)} of {data.filter(item => {
                                            const combinedString = dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ");
                                            return combinedString.includes(searchQuery.toLowerCase());
                                        }).length} Rows
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-auto md:ml-0 overflow-x-auto min-w-0 pr-1 max-w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className="h-8 rounded-lg text-[10px] font-bold text-slate-500 whitespace-nowrap shrink-0 px-2"
                                        >
                                            <ChevronLeft className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Prev</span>
                                        </Button>
                                        <div className="px-2 h-8 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-slate-600 whitespace-nowrap shrink-0">
                                            Pg {currentPage}/{Math.ceil((data.filter(item => dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ").includes(searchQuery.toLowerCase())).length) / itemsPerPage) || 1}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= Math.ceil(data.filter(item => dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ").includes(searchQuery.toLowerCase())).length / itemsPerPage)}
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(data.filter(item => dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ").includes(searchQuery.toLowerCase())).length / itemsPerPage), prev + 1))}
                                            className="h-8 rounded-lg text-[10px] font-bold text-slate-500 whitespace-nowrap shrink-0 px-2"
                                        >
                                            <span className="hidden sm:inline">Next</span> <ChevronRight className="h-3 w-3 sm:ml-1" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 border-l border-slate-100 pl-4 hidden md:flex">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden lg:inline">Rows:</span>
                                        <select
                                            className="h-8 w-16 px-1 py-0 rounded-lg border-slate-200 text-xs font-bold text-slate-600 bg-transparent text-center"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={250}>250</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <Table>
                                <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        {dimensions.map(dim => (
                                            <TableHead key={dim} className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                                {activeDimensionsOptions.find(o => o.value === dim)?.label || dim}
                                            </TableHead>
                                        ))}
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Net Quantity (Pc)</TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Total Volume (Ltr/Kg)</TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">DP Value (৳)</TableHead>
                                        <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">TP Value (৳)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={dimensions.length + 4} className="h-[400px] text-center text-slate-400 italic font-medium">Aggregating Matrix...</TableCell>
                                        </TableRow>
                                    ) : !isFilterApplied() ? (
                                        <TableRow>
                                            <TableCell colSpan={dimensions.length + 4} className="h-[400px] text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                Select filters to generate matrix
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (() => {
                                            const filteredData = data.filter(item => {
                                                const combinedString = dimensions.map(d => (item[d] || "").toString().toLowerCase()).join(" ");
                                                return combinedString.includes(searchQuery.toLowerCase());
                                            });

                                            if (filteredData.length === 0 && searchQuery) {
                                                return (
                                                    <TableRow>
                                                        <TableCell colSpan={dimensions.length + 4} className="h-48 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                            No matches for "{searchQuery}"
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            const displayData = filteredData;
                                            const startIndex = (currentPage - 1) * itemsPerPage;
                                            const paginatedData = displayData.slice(startIndex, startIndex + itemsPerPage);

                                            return paginatedData.map((item, idx) => (
                                                <TableRow key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                    {dimensions.map(dim => (
                                                        <TableCell key={dim} className="py-2.5 px-6 border-r border-slate-50 last:border-0 whitespace-nowrap">
                                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item[dim] || "N/A"}</span>
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="py-2.5 px-6 text-right font-mono text-[11px] text-slate-600 whitespace-nowrap bg-slate-50/30">
                                                        {(item._sum?.qtyPc || 0).toLocaleString()} <span className="text-[9px] text-slate-400">pc</span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-6 text-right font-mono text-[11px] text-slate-600 whitespace-nowrap bg-slate-50/30">
                                                        {(item._sum?.qtyLtrKg || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">ltr/kg</span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-6 text-right font-mono text-[11px] font-black text-emerald-600 whitespace-nowrap bg-emerald-50/10">
                                                        ৳{(item._sum?.dpValue || 0).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-6 text-right font-mono text-[11px] font-black text-emerald-700 whitespace-nowrap bg-emerald-50/30">
                                                        ৳{(item._sum?.tpValue || 0).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
