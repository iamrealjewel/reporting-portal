import { useState, useEffect } from "react";
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
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from "../components/ui/dialog";
import {
    Key,
    Lock,
    Edit2,
    Trash2,
    Shield,
    Search,
    Plus,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../components/ui/confirm-modal";

export default function Permissions() {
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const fetchPermissions = async () => {
        try {
            const { data } = await api.get("/permissions");
            setPermissions(data);
        } catch (error) {
            toast.error("Failed to fetch permissions");
        }
    };

    useEffect(() => {
        document.title = "Permission Management | DMS Portal";
        fetchPermissions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPermission) {
                await api.put(`/permissions/${editingPermission.id}`, formData);
                toast.success("Permission updated successfully");
            } else {
                await api.post("/permissions", formData);
                toast.success("Permission created successfully");
            }
            setIsModalOpen(false);
            setEditingPermission(null);
            setFormData({ name: "", description: "" });
            fetchPermissions();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to save permission");
        }
    };

    const deletePermission = async (id: number) => {
        try {
            await api.delete(`/permissions/${id}`);
            toast.success("Permission deleted successfully");
            fetchPermissions();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete permission");
        }
    };

    const filtered = permissions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Key className="h-6 w-6 text-amber-500" />
                        Core Permissions Matrix
                    </h1>
                    <p className="text-slate-500 text-sm italic">Define low-level action gates for system-wide module orchestration.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Query Permissions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 w-64 bg-white border-slate-200 rounded-lg text-sm"
                        />
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => { setEditingPermission(null); setFormData({ name: "", description: "" }); }}
                                className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-6 h-10 font-bold text-xs uppercase tracking-widest shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden text-slate-900">
                            <div className="bg-[#0F172A] p-6 text-white relative">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {editingPermission ? <Edit2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                                    {editingPermission ? "Update Permission" : "New Permission Entry"}
                                </DialogTitle>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">System Internal Reference Code</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Internal Name (Snake Case)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 font-mono text-xs uppercase tracking-widest"
                                            placeholder="E.G. EXPORT_DATA_REPORTS"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Functional Description</label>
                                    <textarea
                                        className="w-full p-3 min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Briefly explain what this permission allows..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg h-11 text-xs font-bold uppercase tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold uppercase tracking-widest shadow-md">
                                        {editingPermission ? "Update Gate" : "Define Access"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">System Key</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Definition / Implementation</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right px-6">Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((p) => (
                            <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                                            <Lock className="h-3.5 w-3.5" />
                                        </div>
                                        <code className="text-[11px] font-mono font-bold tracking-tight text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100 uppercase uppercase font-bold tracking-widest">
                                            {p.name}
                                        </code>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <p className="text-sm font-medium text-slate-600 italic">"{p.description}"</p>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setEditingPermission(p); setFormData({ name: p.name, description: p.description }); setIsModalOpen(true); }}
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setConfirmDelete({ isOpen: true, id: p.id })}
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <ArrowRight className="h-3 w-3" />
                        Pipeline Security Matrix v1.4 • Automated Gatekeeper Active
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={() => confirmDelete.id && deletePermission(confirmDelete.id)}
                title="Remove System Permission"
                description="Are you sure you want to delete this internal permission? This is a core identity gate and removing it might break existing role configurations and security logic."
                variant="danger"
                confirmText="Confirm Removal"
            />
        </div>
    );
}
