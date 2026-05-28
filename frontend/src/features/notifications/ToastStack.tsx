import React from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastItem } from './useToastStack';

const iconFor = (type: ToastItem['type']) => {
    if (type === 'success') return <CheckCircle2 size={18} className="text-emerald-600" />;
    if (type === 'error') return <XCircle size={18} className="text-rose-600" />;
    return <Info size={18} className="text-sky-600" />;
};

const borderFor = (type: ToastItem['type']) => {
    if (type === 'success') return 'border-emerald-200';
    if (type === 'error') return 'border-rose-200';
    return 'border-sky-200';
};

interface ToastStackProps {
    toasts: ToastItem[];
    onClose: (id: string) => void;
}

const ToastStack: React.FC<ToastStackProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2 w-[min(420px,calc(100vw-2rem))]">
            {toasts.map(t => (
                <div key={t.id} className={`rounded-2xl bg-white border ${borderFor(t.type)} shadow-lg p-4`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">{iconFor(t.type)}</div>
                            <div>
                                <div className="text-sm font-black text-slate-900">{t.title}</div>
                                {t.message && <div className="text-xs text-slate-500 mt-0.5">{t.message}</div>}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onClose(t.id)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                            aria-label="Close toast"
                        >
                            <X size={16} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastStack;

