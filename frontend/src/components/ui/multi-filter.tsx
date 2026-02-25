import { useState, useEffect, useRef } from "react";
import {
    Filter,
    Search,
    CheckSquare,
    Square,
    ChevronDown
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

interface MultiSelectFilterProps {
    label: string;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
}

export function MultiSelectFilter({
    label,
    options = [],
    selectedValues = [],
    onChange
}: MultiSelectFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hasSelection = selectedValues.length > 0;

    const toggleValue = (val: string) => {
        const next = selectedValues.includes(val)
            ? selectedValues.filter(v => v !== val)
            : [...selectedValues, val];
        onChange(next);
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
        setSearchTerm("");
    };

    const filteredOptions = (options || []).filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 h-8 px-3 rounded-lg border transition-all ${isOpen ? 'border-slate-900 bg-white ring-2 ring-slate-900/5' :
                    hasSelection ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-500'
                    }`}
            >
                <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
                <Filter className={`h-3 w-3 shrink-0 ${hasSelection ? 'text-emerald-600' : 'text-slate-400'}`} />
                {hasSelection && (
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                        {selectedValues.length}
                    </span>
                )}
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 shadow-2xl rounded-xl p-3 z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="mb-2 relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <Input
                            placeholder={`Search ${label}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 pl-8 rounded-lg border-slate-200 text-[11px] font-medium"
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                        {filteredOptions.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-400 italic">No options found</p>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = selectedValues.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => toggleValue(opt)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left ${isSelected
                                            ? 'bg-emerald-50 text-emerald-900'
                                            : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        {isSelected ? (
                                            <CheckSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                            <Square className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                        )}
                                        <span className="text-[11px] font-bold uppercase tracking-tight truncate">{opt}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange(options)}
                            className="flex-1 h-7 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                        >
                            Select All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="flex-1 h-7 rounded-md text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50"
                        >
                            Clear
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-2 h-7 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-sm"
                    >
                        Apply Filters
                    </Button>
                </div>
            )}
        </div>
    );
}
