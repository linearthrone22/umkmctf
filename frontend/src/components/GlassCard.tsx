import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => {
    return (
        <div className={`glass rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
            {children}
        </div>
    );
};

export default GlassCard;
