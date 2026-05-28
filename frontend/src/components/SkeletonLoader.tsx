import React from 'react';

interface SkeletonLoaderProps {
    type?: 'card' | 'list' | 'text';
    count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'text', count = 1 }) => {
    const items = Array.from({ length: count });

    if (type === 'card') {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-2xl"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="animate-pulse space-y-3">
                {items.map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-pulse space-y-2">
            {items.map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
