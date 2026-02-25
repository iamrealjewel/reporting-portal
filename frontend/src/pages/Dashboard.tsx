import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import {
    DollarSign,
    Package,
    ShoppingCart,
    ChevronRight,
    RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function formatCompactNumber(number: number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return number.toString();
}

export default function Dashboard() {
    const [kpis, setKpis] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [stockByCat, setStockByCat] = useState<any[]>([]);
    const [dimension, setDimension] = useState("brand");
    const [loading, setLoading] = useState(true);
    const [timeTab, setTimeTab] = useState("mtd");
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        today.setDate(1);
        return today.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [stackedDivisionData, setStackedDivisionData] = useState<any[]>([]);

    const handleTabClick = (tab: string) => {
        setTimeTab(tab);
        const today = new Date();
        const end = today.toISOString().split('T')[0];

        const start = new Date(today);
        start.setHours(0, 0, 0, 0);

        if (tab === 'today') {
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end);
        } else if (tab === 'wtd') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end);
        } else if (tab === 'mtd') {
            start.setDate(1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end);
        } else if (tab === 'ytd') {
            start.setMonth(0, 1);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end);
        } else if (tab === 'all') {
            setStartDate('');
            setEndDate('');
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const dateParams = startDate && endDate ? `startDate=${startDate}&endDate=${endDate}` : '';
            const qPrefix = dateParams ? `?${dateParams}` : '';
            const qAnd = dateParams ? `&${dateParams}` : '';

            const [kpiRes, trendRes, summaryRes, stockRes, stackedDivRes] = await Promise.all([
                api.get(`/analytics/dashboard-kpis${qPrefix}`),
                api.get(`/analytics/sales-trends${qPrefix}`),
                api.get(`/analytics/sales-summary?dimension=${dimension}${qAnd}`),
                api.get(`/analytics/stock-summary?dimension=division,category${qAnd}`),
                api.get(`/analytics/sales-summary?dimension=division,prodLine${qAnd}`)
            ]);

            setKpis(kpiRes.data);
            setTrends((trendRes.data || []).map((t: any) => ({
                ...t,
                day: t.day ? new Date(t.day).toLocaleDateString() : 'N/A'
            })));

            setSummaryData((summaryRes.data || []).map((item: any) => {
                const dims = dimension.split(',');
                const label = dims.map(d => item[d] || 'N/A').join(' \u2192 ');
                return { ...item, chartLabel: label };
            }));

            // Pivot stock data for Stacked Bar (grouped by division, stacked by category)
            const stockMap = new Map<string, any>();
            (stockRes.data || []).forEach((item: any) => {
                const div = item.division || 'Unknown';
                const cat = item.category || 'Unknown';
                const val = Number(item._sum?.dealerAmount || 0);

                if (!stockMap.has(div)) {
                    stockMap.set(div, { division: div, total: 0 });
                }
                const divObj = stockMap.get(div);
                divObj[cat] = (divObj[cat] || 0) + val;
                divObj.total += val;
            });

            const finalStock = Array.from(stockMap.values()).sort((a, b) => b.total - a.total);
            setStockByCat(finalStock);

            // Pivot explicit Sales Division map for Stacked Bar (grouped by division, stacked by prodLine)
            const divMap = new Map<string, any>();
            (stackedDivRes.data || []).forEach((item: any) => {
                const div = item.division || 'Unknown';
                const line = item.prodLine || 'Unknown';
                const val = Number(item._sum?.dpValue || 0);

                if (!divMap.has(div)) {
                    divMap.set(div, { division: div, total: 0 });
                }
                const divObj = divMap.get(div);
                divObj[line] = (divObj[line] || 0) + val;
                divObj.total += val;
            });
            const finalDivMap = Array.from(divMap.values()).sort((a, b) => b.total - a.total);
            setStackedDivisionData(finalDivMap);

        } catch (error) {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Executive Dashboard | DMS Portal";
        fetchDashboardData();
    }, [dimension, startDate, endDate]);

    if (!kpis && loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <RefreshCcw className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1 italic">Real-time performance metrics and distribution analytics.</p>
                </div>

                <div className="flex flex-col xl:flex-row items-center justify-center gap-3 w-full xl:col-span-1 border border-slate-200/60 p-1.5 rounded-2xl bg-white shadow-sm mt-4 xl:mt-0 xl:flex-1 max-w-4xl mx-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto">
                        {['today', 'wtd', 'mtd', 'ytd', 'all'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 xl:flex-none ${timeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 px-2 py-1 w-full xl:w-auto justify-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setTimeTab('custom'); }}
                            className="h-8 w-32 text-xs font-bold border rounded-lg bg-slate-50 border-slate-200 px-2 text-slate-600 cursor:pointer focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-slate-300 font-bold px-1 flex-shrink-0">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setTimeTab('custom'); }}
                            className="h-8 w-32 text-xs font-bold border rounded-lg bg-slate-50 border-slate-200 px-2 text-slate-600 cursor:pointer focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4 xl:mt-0">
                    <Button variant="outline" onClick={fetchDashboardData} className="h-11 rounded-xl border-slate-200 shrink-0 shadow-sm ml-auto">
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Total Sales Value"
                    value={`৳${formatCompactNumber(kpis?.sales?.totalAmount || 0)}`}
                    subValue="Target: ৳20M"
                    icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
                    gradient="from-emerald-500/10 to-teal-500/10"
                    border="border-emerald-100"
                    breakdown={kpis?.sales?.breakdown?.map((b: any) => ({
                        label: b.prodLine,
                        value: `৳${formatCompactNumber(b.amount || 0)}`,
                        percentage: kpis?.sales?.totalAmount ? ((b.amount || 0) / kpis.sales.totalAmount) * 100 : 0
                    }))}
                />

                <KPICard
                    title="Sales Volume"
                    value={formatCompactNumber(kpis?.sales?.totalVolume || 0)}
                    subValue="Target: 50,000"
                    icon={<ShoppingCart className="h-6 w-6 text-amber-600" />}
                    gradient="from-amber-500/10 to-orange-500/10"
                    border="border-amber-100"
                    breakdown={kpis?.sales?.breakdown?.map((b: any) => ({
                        label: b.prodLine,
                        value: `${formatCompactNumber(b.volume || 0)}`,
                        percentage: kpis?.sales?.totalVolume ? ((b.volume || 0) / kpis.sales.totalVolume) * 100 : 0
                    }))}
                />

                <KPICard
                    title="Stock Inventory Value"
                    value={`৳${formatCompactNumber(kpis?.stock?.totalValue || 0)}`}
                    subValue={`Total volume: ${formatCompactNumber(kpis?.stock?.totalVolume || 0)}`}
                    icon={<Package className="h-6 w-6 text-blue-600" />}
                    gradient="from-blue-500/10 to-indigo-500/10"
                    border="border-blue-100"
                    breakdown={kpis?.stock?.breakdown?.map((b: any) => ({
                        label: b.category,
                        value: `৳${formatCompactNumber(b.value || 0)}`,
                        percentage: kpis?.stock?.totalValue ? ((b.value || 0) / kpis.stock.totalValue) * 100 : 0
                    }))}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-2 rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Revenue Performance Trend</CardTitle>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Daily Sales Amount (TK)</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        {Array.from(new Set(trends.flatMap(t => Object.keys(t).filter(k => k !== 'day' && k !== 'total'))))
                                            .map((key, idx) => (
                                                <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                                                </linearGradient>
                                            ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[2]}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />

                                    {Array.from(new Set(trends.flatMap(t => Object.keys(t).filter(k => k !== 'day' && k !== 'total'))))
                                        .map((key, idx) => (
                                            <Area
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                name={key}
                                                stackId="1"
                                                stroke={COLORS[idx % COLORS.length]}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill={`url(#color-${key})`}
                                            />
                                        ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock by Category Card */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg font-bold text-slate-900">Inventory Mix</CardTitle>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Distribution by Category</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stockByCat} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="division"
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val / 1000000).toFixed(1)}M`} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />

                                    {Array.from(new Set(stockByCat.flatMap(s => Object.keys(s).filter(k => k !== 'division' && k !== 'total'))))
                                        .map((cat, idx) => (
                                            <Bar
                                                key={cat}
                                                dataKey={cat}
                                                stackId="a"
                                                fill={COLORS[idx % COLORS.length]}
                                                radius={
                                                    // Only round the top if we wanted to, but stacked bars act weird with radiuses sometimes. Leaving flat.
                                                    [0, 0, 0, 0]
                                                }
                                            />
                                        ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Dimension */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden lg:col-span-full">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Revenue Contribution</CardTitle>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Grouped by active selection</p>
                        </div>
                        <Select value={dimension} onValueChange={setDimension}>
                            <SelectTrigger className="w-[180px] h-9 rounded-lg border-slate-200 bg-white">
                                <SelectValue placeholder="Dimension" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="division">Division</SelectItem>
                                <SelectItem value="brand">Brand</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="prodLine">Product Line</SelectItem>
                                <SelectItem value="division,brand">Division & Brand</SelectItem>
                                <SelectItem value="division,prodLine">Division & Prod Line</SelectItem>
                                <SelectItem value="brand,division">Brand & Division</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData.slice(0, 15)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="chartLabel"
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="_sum.dpValue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales by Division Stacked */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden lg:col-span-full">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Revenue by Division</CardTitle>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Stacked by Product Line</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stackedDivisionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="division"
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val / 1000000).toFixed(1)}M`} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />

                                    {Array.from(new Set(stackedDivisionData.flatMap(s => Object.keys(s).filter(k => k !== 'division' && k !== 'total'))))
                                        .map((line, idx) => (
                                            <Bar
                                                key={line}
                                                dataKey={line}
                                                stackId="b"
                                                fill={COLORS[idx % COLORS.length]}
                                                radius={[0, 0, 0, 0]}
                                            />
                                        ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products Table */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden lg:col-span-full">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold text-slate-900">Top Revenue Generators</CardTitle>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Description</th>
                                    <th className="text-right py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {kpis?.topProducts?.map((prod: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 truncate max-w-[250px]">{prod.productName}</span>
                                                <span className="text-[10px] text-slate-400 uppercase">Rank #{idx + 1}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-sm font-mono font-bold text-blue-600">৳{prod._sum?.dpValue?.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, subValue, icon, gradient, border, breakdown }: any) {
    return (
        <Card className={`rounded-2xl border ${border} shadow-sm overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-bl-[100px] -mr-6 -mt-6 opacity-60 pointer-events-none`}></div>
            <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                        <div className="flex items-center gap-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 italic">{subValue}</span>
                        </div>
                    </div>
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>

                {breakdown && breakdown.length > 0 && (
                    <div className="mt-5 border-t border-slate-100/80 pt-4">
                        <div className="flex flex-row items-center justify-between gap-1 w-full">
                            {breakdown.slice(0, 4).map((item: any, idx: number) => {
                                const radius = 22;
                                const circumference = 2 * Math.PI * radius;
                                const strokeDashoffset = circumference - ((item.percentage || 0) / 100) * circumference;

                                return (
                                    <div key={idx} className="flex flex-col items-center justify-center space-y-2 flex-1 min-w-0">
                                        <div className="relative w-14 h-14 flex items-center justify-center">
                                            <svg className="transform -rotate-90 w-14 h-14" viewBox="0 0 52 52">
                                                <circle cx="26" cy="26" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                <circle
                                                    cx="26" cy="26"
                                                    r={radius}
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    className="text-blue-500 transition-all duration-1000 ease-in-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center w-full h-full text-center p-0.5">
                                                <span className="text-[9px] font-black text-slate-800 leading-tight tracking-tighter w-full overflow-hidden text-ellipsis" title={item.value}>{item.value}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center leading-tight max-w-full">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center truncate w-full" title={item.label}>{item.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
