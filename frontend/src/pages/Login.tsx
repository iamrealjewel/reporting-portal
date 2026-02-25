import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogIn, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | DMS Portal";
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            login(data.token, data.user);
            toast.success("Welcome back, " + data.user.name);
            navigate("/");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden">
            {/* Left side: Information/Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 max-w-lg">
                    <div className="bg-blue-600 w-16 h-1 w-12 mb-8 rounded-full"></div>
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        Streamlining DMS <br />
                        Data & Visibility.
                    </h1>
                    <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                        Access your distribution metrics, stock movements, and sales performance in one unified, secure platform.
                    </p>
                    <div className="space-y-4">
                        {['Stock Management', 'Sales Forecasting', 'RBAC Security'].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-gray-300">
                                <div className="h-5 w-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                                    <ChevronRight className="h-3 w-3 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-12 left-12">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                            <ShieldAlert className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-white font-bold tracking-tight text-xl uppercase">DMS Portal</span>
                    </div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="text-left space-y-2">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <span className="text-slate-900 font-bold tracking-tight text-xl uppercase italic">DMS Portal</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 text-sm">Enter your system credentials below.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@ispahanibd.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
                                <a href="#" className="text-xs text-blue-600 hover:underline font-medium">Forgot password?</a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-all"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg transition-all shadow-sm"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" />
                                    Sign In to Portal
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="pt-8 text-center">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                            &copy; 2026 DMS REPORTING ENGINE. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
