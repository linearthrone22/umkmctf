import React from 'react';
import { Star } from 'lucide-react';

interface StarsProps {
    value: number;
    onChange?: (next: number) => void;
    size?: number;
}

const Stars: React.FC<StarsProps> = ({ value, onChange, size = 18 }) => {
    const safe = Math.max(0, Math.min(5, Math.round(value)));

    return (
        <div className="inline-flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
                const n = i + 1;
                const active = n <= safe;
                return (
                    <button
                        key={n}
                        type="button"
                        disabled={!onChange}
                        onClick={() => onChange?.(n)}
                        className={`${onChange ? 'cursor-pointer' : 'cursor-default'} p-0.5 rounded disabled:opacity-100`}
                        aria-label={`Star ${n}`}
                    >
                        <Star
                            size={size}
                            className={active ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default Stars;
