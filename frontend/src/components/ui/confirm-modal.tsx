import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "warning",
}: ConfirmModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <div className={`p-6 ${variant === 'danger' ? 'bg-red-50' : variant === 'warning' ? 'bg-amber-50' : 'bg-blue-50'} flex flex-col items-center text-center gap-4`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-100 text-red-600' :
                            variant === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                        }`}>
                        {variant === 'danger' || variant === 'warning' ? <AlertTriangle className="h-7 w-7" /> : <HelpCircle className="h-7 w-7" />}
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-2 leading-relaxed">
                            {description}
                        </DialogDescription>
                    </div>
                </div>
                <DialogFooter className="p-4 bg-slate-50/50 flex gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-12 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white hover:shadow-sm transition-all"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 rounded-xl h-12 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                                variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                                    'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
