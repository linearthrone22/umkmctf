import React, { useRef, useEffect } from 'react';
import { Terminal, Download } from 'lucide-react';

import type { LogEntry } from '../types';

interface TerminalLoggerProps {
    logs: LogEntry[];
    onExport: () => void;
}

const TerminalLogger: React.FC<TerminalLoggerProps> = ({ logs, onExport }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'SUCCESS': return 'text-emerald-400';
            case 'ERROR': return 'text-red-400';
            case 'AI': return 'text-blue-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <Terminal size={16} />
                    <span>Integration Logger (Proof of Integration)</span>
                </div>
                <button 
                    onClick={onExport}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    <Download size={14} />
                    Export Log
                </button>
            </div>
            <div 
                ref={scrollRef}
                className="p-4 h-48 overflow-y-auto font-mono text-xs leading-relaxed terminal-scrollbar"
            >
                {logs.length === 0 ? (
                    <div className="text-slate-500 italic">Waiting for agentic actions...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1">
                            <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                            <span className={`font-bold ${getLevelColor(log.level)}`}>{log.level}:</span>{' '}
                            <span className="text-slate-300">{log.message}</span>
                            {log.payload && (
                                <details className="ml-4 mt-1">
                                    <summary className="text-slate-500 cursor-pointer hover:text-slate-400">View Details</summary>
                                    <pre className="bg-slate-950 p-2 rounded mt-1 text-slate-400 overflow-x-auto">
                                        {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TerminalLogger;
