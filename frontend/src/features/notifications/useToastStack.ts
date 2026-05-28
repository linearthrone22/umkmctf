import { useCallback, useMemo, useState } from 'react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

export const useToastStack = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const push = useCallback((toast: Omit<ToastItem, 'id'>, ttlMs = 4500) => {
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const item: ToastItem = { id, ...toast };
        setToasts(prev => [item, ...prev].slice(0, 5));
        window.setTimeout(() => remove(id), ttlMs);
    }, [remove]);

    const api = useMemo(() => ({ toasts, push, remove }), [push, remove, toasts]);
    return api;
};

