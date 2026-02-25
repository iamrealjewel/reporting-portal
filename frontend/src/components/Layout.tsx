import { useLocation, Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Users,
    ShieldCheck,
    Key,
    Package,
    FileBox,
    ChevronRight,
    LogOut,
    LayoutDashboard,
    Menu,
    Bell,
    Search,
    ChevronDown,
    TrendingUp
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (name: string) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    interface MenuItem {
        name?: string;
        icon?: any;
        path?: string;
        permission?: string;
        segment?: string;
        children?: { name: string; path: string }[];
    }

    const menuItems: MenuItem[] = [
        { name: "Executive Dashboard", icon: LayoutDashboard, path: "/", permission: "view_stock_reports" },
        { segment: "Data Operations" },
        { name: "Import Stock", icon: Package, path: "/import-stock", permission: "import_stock" },
        { name: "Import Sales", icon: FileBox, path: "/import-sales", permission: "import_sales" },
        { segment: "Register Ledger" },
        {
            name: "Sales Analytical Summaries",
            icon: TrendingUp,
            path: "/sales-summaries",
            permission: "view_sales_reports"
        },
        {
            name: "Stock Analytical Summaries",
            icon: Package,
            path: "/stock-summaries",
            permission: "view_stock_reports"
        },
        {
            name: "Sales Register Table",
            icon: TrendingUp,
            path: "/sales-report",
            permission: "view_sales_reports"
        },
        {
            name: "Stock Ledger Table",
            icon: Package,
            path: "/stock-report",
            permission: "view_stock_reports"
        },
        { segment: "Administration" },
        { name: "Users", icon: Users, path: "/users", permission: "view_users" },
        { name: "Roles", icon: ShieldCheck, path: "/roles", permission: "view_roles" },
        { name: "Permissions", icon: Key, path: "/permissions", permission: "view_permissions" },
    ];

    const hasPermission = (perm?: string) => {
        if (!perm) return true;
        return user?.permissions.includes(perm) || user?.role === "Admin";
    };

    const activeItem = menuItems.find(item => item.path === location.pathname);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-[#0F172A] text-slate-300 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl z-30",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-bold text-lg text-white tracking-tight whitespace-nowrap text-xs">DMS PORTAL</span>
                        )}
                    </div>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto custom-scrollbar h-[calc(100vh-64px)] pb-20">
                    {menuItems.map((item, idx) => {
                        if (item.segment) {
                            return isSidebarOpen ? (
                                <div key={idx} className="px-4 pt-6 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                    {item.segment}
                                </div>
                            ) : (
                                <div key={idx} className="h-px bg-slate-800 my-4 mx-4" />
                            );
                        }

                        if (!hasPermission(item.permission)) return null;

                        const isActive = item.path ? location.pathname === item.path : (item.children ? item.children.some(child => location.pathname + location.search === child.path) : false);
                        const Icon = item.icon!;
                        const isMenuOpen = openMenus[item.name!] !== undefined ? openMenus[item.name!] : isActive;

                        if (item.children) {
                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.name!)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-blue-600/10 text-white"
                                                : "hover:bg-slate-800 text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center shrink-0",
                                            isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                                        )}>
                                            <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                        </div>
                                        {isSidebarOpen && (
                                            <>
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <ChevronDown className={cn(
                                                    "h-3 w-3 ml-auto transition-transform text-slate-500",
                                                    isMenuOpen && "rotate-180"
                                                )} />
                                            </>
                                        )}
                                    </button>
                                    {isMenuOpen && isSidebarOpen && item.children && (
                                        <div className="ml-9 space-y-1">
                                            {(item.children as any[]).map(child => {
                                                const isChildActive = location.pathname + location.search === child.path || (child.path === "/sales-report" && location.pathname === "/sales-report") || (child.path === "/stock-report" && location.pathname === "/stock-report");
                                                return (
                                                    <Link
                                                        key={child.name}
                                                        to={child.path}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                                                            isChildActive
                                                                ? "text-blue-500 bg-blue-500/5 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]"
                                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                                        )}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                to={item.path!}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-blue-600/10 text-white"
                                        : "hover:bg-slate-800 text-slate-400 hover:text-white"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center shrink-0",
                                    isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                                )}>
                                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                </div>
                                {isSidebarOpen && (
                                    <span className="text-sm font-medium">{item.name}</span>
                                )}
                                {isActive && isSidebarOpen && (
                                    <ChevronRight className="h-3 w-3 ml-auto text-blue-500" />
                                )}

                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.5)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topnav */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-slate-500 hover:bg-slate-50"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                            <span className="hover:text-slate-600 cursor-pointer transition-colors uppercase tracking-widest text-[10px] font-bold">Main</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-slate-900 font-semibold tracking-tight uppercase text-[10px] font-bold tracking-widest">
                                {activeItem?.name || "Dashboard"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Global System Search..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-50 relative shrink-0">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>

                        <div className="h-8 w-px bg-slate-200 mx-2 shrink-0"></div>

                        {/* User Menu */}
                        <div className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-100 group shrink-0">
                            <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
                                {user?.name?.[0].toUpperCase()}
                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-0.5">{user?.name}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{user?.role}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={logout}
                            className="hidden lg:flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-all shrink-0 h-9"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Logout</span>
                        </Button>
                    </div>
                </header>

                {/* Content Viewport */}
                <main className="flex-1 overflow-y-auto px-6 pt-[10px] pb-8 custom-scrollbar relative">
                    <div className="w-full animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
