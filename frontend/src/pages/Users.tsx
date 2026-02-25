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
    UserPlus,
    Edit2,
    Trash2,
    Search,
    Mail,
    User as UserIcon,
    Shield,
    Key
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../components/ui/confirm-modal";

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", roleId: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/users");
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch users");
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get("/roles");
            setRoles(data);
        } catch (error) {
            toast.error("Failed to fetch roles");
        }
    };

    useEffect(() => {
        document.title = "User Management | DMS Portal";
        fetchUsers();
        fetchRoles();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
                toast.success("User updated successfully");
            } else {
                await api.post("/users", formData);
                toast.success("User created successfully");
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", roleId: "" });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to save user");
        }
    };

    const deleteUser = async (id: number) => {
        try {
            await api.delete(`/users/${id}`);
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete user");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Users</h1>
                    <p className="text-slate-500 text-sm italic">Manage access and account settings for your organization.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search Users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 w-64 bg-white border-slate-200 rounded-lg text-sm"
                        />
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => { setEditingUser(null); setFormData({ name: "", email: "", password: "", roleId: "" }); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 h-10 font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-[#0F172A] p-6 text-white relative">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {editingUser ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                                    {editingUser ? "Update User" : "Create New User"}
                                </DialogTitle>
                                <p className="text-slate-400 text-xs mt-1">Fill in the details below to sync access privileges.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11 bg-slate-50 border-slate-200"
                                            placeholder="Jahirul Islam"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            className="pl-10 h-11 bg-slate-50 border-slate-200"
                                            placeholder="name@corp.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {!editingUser && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Temporary Password</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="password"
                                                className="pl-10 h-11 bg-slate-50 border-slate-200"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Role</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <select
                                            className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                            value={formData.roleId}
                                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                        >
                                            <option value="">Select a Role</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg h-11 text-xs font-bold uppercase tracking-widest uppercase">Cancel</Button>
                                    <Button type="submit" className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold uppercase tracking-widest uppercase shadow-md pointer shadow-blue-500/20">
                                        {editingUser ? "Update Access" : "Create Account"}
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
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-6">User Details</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Role</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-sm">No users found matching your search.</TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 overflow-hidden">
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 tracking-tight leading-4 mb-1">{u.name}</span>
                                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{u.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 italic">
                                                {u.role?.name || "No Role"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingUser(u); setFormData({ name: u.name, email: u.email, password: "", roleId: u.role?.id || "" }); setIsModalOpen(true); }}
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setConfirmDelete({ isOpen: true, id: u.id })}
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-400 italic">Showing {filteredUsers.length} of {users.length} system users</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-slate-500" disabled>Prev</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-blue-600" disabled>Next</Button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={() => confirmDelete.id && deleteUser(confirmDelete.id)}
                title="Delete User account"
                description="Are you sure you want to remove this user account? This action cannot be undone and will revoke all system access for this user."
                variant="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
