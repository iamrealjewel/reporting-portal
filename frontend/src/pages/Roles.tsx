import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from "../components/ui/dialog";
import {
    ShieldCheck,
    Edit2,
    Trash2,
    CheckCircle2,
    Text,
    Lock,
    Plus,
    ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../components/ui/confirm-modal";

export default function Roles() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formData, setFormData] = useState<any>({ name: "", description: "", permissionIds: [] });
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const fetchData = async () => {
        try {
            const rolesRes = await api.get("/roles");
            const permRes = await api.get("/permissions");
            setRoles(rolesRes.data);
            setPermissions(permRes.data);
        } catch (error) {
            toast.error("Failed to fetch roles and permissions");
        }
    };

    useEffect(() => {
        document.title = "Role Management | DMS Portal";
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, formData);
                toast.success("Role updated successfully");
            } else {
                await api.post("/roles", formData);
                toast.success("Role created successfully");
            }
            setIsModalOpen(false);
            setEditingRole(null);
            setFormData({ name: "", description: "", permissionIds: [] });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to save role");
        }
    };

    const togglePermission = (id: number) => {
        const ids = [...formData.permissionIds];
        const index = ids.indexOf(id);
        if (index > -1) ids.splice(index, 1);
        else ids.push(id);
        setFormData({ ...formData, permissionIds: ids });
    };

    const deleteRole = async (id: number) => {
        try {
            await api.delete(`/roles/${id}`);
            toast.success("Role deleted successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete role");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-indigo-600" />
                        Access Roles
                    </h1>
                    <p className="text-slate-500 text-sm italic">Define security profiles and permission sets for system users.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => { setEditingRole(null); setFormData({ name: "", description: "", permissionIds: [] }); }}
                            className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-6 h-11 font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Define New Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden text-slate-900">
                        <div className="bg-[#0F172A] p-6 text-white text-slate-900">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {editingRole ? <Edit2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                {editingRole ? "Reconfigure Access Role" : "Define Access Profile"}
                            </DialogTitle>
                            <p className="text-slate-400 text-xs mt-1">Specify which system modules this role can interact with.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 bg-white space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Role Identifier</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-lg"
                                            placeholder="e.g. Regional Manager"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Description / Notes</label>
                                    <div className="relative">
                                        <Text className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                                        <textarea
                                            className="w-full pl-10 pt-3 pb-3 min-h-[80px] bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Briefly describe the responsibilities of this role..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Module Permissions Matrix</label>
                                <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    {permissions.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => togglePermission(p.id)}
                                            className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                        ${formData.permissionIds.includes(p.id)
                                                    ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100"
                                                    : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"}
                      `}
                                        >
                                            <div className={`
                        h-5 w-5 rounded-full flex items-center justify-center transition-colors
                        ${formData.permissionIds.includes(p.id) ? "bg-blue-600 border-none" : "bg-slate-200 group-hover:bg-slate-300"}
                      `}>
                                                {formData.permissionIds.includes(p.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-bold uppercase tracking-tight ${formData.permissionIds.includes(p.id) ? "text-blue-700" : "text-slate-600"}`}>
                                                    {p.name.replace(/_/g, " ")}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">{p.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg h-11 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-100 italic">Dismiss</Button>
                                <Button type="submit" className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 h-11 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                    {editingRole ? "Apply Structural Changes" : "Confirm Profile Setup"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">Role Profile</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Security Level</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Permission Metrics</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((r) => (
                            <TableRow key={r.id} className="hover:bg-slate-50/30 transition-colors group">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 tracking-tight leading-4 mb-1 uppercase text-xs">{r.name}</span>
                                            <span className="text-slate-400 text-[11px] italic max-w-xs truncate">{r.description || "No description provided."}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${r.name === 'Admin' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {r.name === 'Admin' ? 'Superuser' : 'Standard'}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: `${(r.permissions.length / permissions.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-900">{r.permissions.length}/{permissions.length}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingRole(r);
                                                setFormData({
                                                    name: r.name,
                                                    description: r.description,
                                                    permissionIds: r.permissions.map((p: any) => p.id)
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setConfirmDelete({ isOpen: true, id: r.id })}
                                            disabled={r.name === 'Admin'}
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="bg-slate-50/50 p-4 border-t border-slate-200">
                    <p className="text-[11px] text-slate-400 italic">Note: Role changes will take effect on the next user login. System defaults like 'Admin' cannot be removed.</p>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={() => confirmDelete.id && deleteRole(confirmDelete.id)}
                title="Delete System Role"
                description="Are you sure you want to delete this role? This will revoke all associated permissions from users assigned to this role."
                variant="danger"
                confirmText="Delete Role"
            />
        </div>
    );
}
