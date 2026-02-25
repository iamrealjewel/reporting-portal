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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ShoppingCart,
    Layers,
    ChevronRight,
    RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
    const [kpis, setKpis] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [stockByCat, setStockByCat] = useState<any[]>([]);
    const [dimension, setDimension] = useState("brand");
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [kpiRes, trendRes, summaryRes, stockRes] = await Promise.all([
                api.get("/analytics/dashboard-kpis"),
                api.get("/analytics/sales-trends"),
                api.get(`/analytics/sales-summary?dimension=${dimension}`),
                api.get("/analytics/stock-summary?dimension=category"),
            ]);

            setKpis(kpiRes.data);
            setTrends((trendRes.data || []).map((t: any) => ({
                ...t,
                day: t.day ? new Date(t.day).toLocaleDateString() : 'N/A'
            })));
            setSummaryData(summaryRes.data || []);
            setStockByCat(stockRes.data || []);
        } catch (error) {
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Executive Dashboard | DMS Portal";
        fetchDashboardData();
    }, [dimension]);

    if (!kpis && loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <RefreshCcw className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1 italic">Real-time performance metrics and distribution analytics.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchDashboardData} className="h-10 rounded-xl border-slate-200">
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Sales Value"
                    value={`৳${(kpis?.totalSalesAmount || 0).toLocaleString()}`}
                    subValue="+12.5% from last month"
                    icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
                    gradient="from-emerald-500/10 to-teal-500/10"
                    border="border-emerald-100"
                />
                <KPICard
                    title="Stock Inventory Value"
                    value={`৳${(kpis?.totalStockValue || 0).toLocaleString()}`}
                    subValue="Current valuation"
                    icon={<Package className="h-6 w-6 text-blue-600" />}
                    gradient="from-blue-500/10 to-indigo-500/10"
                    border="border-blue-100"
                />
                <KPICard
                    title="Sales Volume (Qty)"
                    value={(kpis?.totalSalesQty || 0).toLocaleString()}
                    subValue="Pieces sold"
                    icon={<ShoppingCart className="h-6 w-6 text-amber-600" />}
                    gradient="from-amber-500/10 to-orange-500/10"
                    border="border-amber-100"
                />
                <KPICard
                    title="Total Transactions"
                    value={(kpis?.totalSalesTransactions || 0).toLocaleString()}
                    subValue="Invoices processed"
                    icon={<Layers className="h-6 w-6 text-purple-600" />}
                    gradient="from-purple-500/10 to-fuchsia-500/10"
                    border="border-purple-100"
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
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
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
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
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
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockByCat.slice(0, 6)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="_sum.dealerAmount"
                                        nameKey="category"
                                    >
                                        {stockByCat.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {stockByCat.slice(0, 4).map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="font-bold text-slate-600 truncate max-w-[120px]">{item.category}</span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-900">৳{(item._sum?.dealerAmount / 1000000).toFixed(1)}M</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Dimension */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">Revenue Contribution</CardTitle>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Grouped by active selection</p>
                        </div>
                        <Select value={dimension} onValueChange={setDimension}>
                            <SelectTrigger className="w-[140px] h-9 rounded-lg border-slate-200 bg-white">
                                <SelectValue placeholder="Dimension" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brand">Brand</SelectItem>
                                <SelectItem value="division">Division</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="depot">Depot</SelectItem>
                                <SelectItem value="prodLine">Product Line</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryData.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey={dimension} stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} interval={0} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip />
                                    <Bar dataKey="_sum.dpValue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products Table */}
                <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
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

function KPICard({ title, value, subValue, icon, gradient, border }: any) {
    return (
        <Card className={`rounded-2xl border ${border} shadow-sm overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} rounded-bl-[100px] -mr-6 -mt-6 opacity-60`}></div>
            <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                        <div className="flex items-center gap-1 pt-1">
                            {subValue.includes('+') ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-slate-300" />}
                            <span className="text-[10px] font-bold text-slate-400 italic">{subValue}</span>
                        </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
