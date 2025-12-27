
import React, { useState, useEffect } from 'react';
import { logService } from '../services/logService';
import { LogEntry, LogType } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';

interface LogViewerProps {
  onClose: () => void;
}

const getLogTypeStyles = (type: LogType): string => {
    switch (type) {
        case 'api': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'info': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'error': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>(logService.getLogs());

    useEffect(() => {
        const handleUpdate = () => setLogs(logService.getLogs());
        const unsubscribe = logService.subscribe(handleUpdate);
        return () => unsubscribe();
    }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center md:p-4" onClick={onClose}>
      <div className="bg-white md:rounded-3xl shadow-2xl w-full h-full md:max-w-4xl md:h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">System Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live tracking of API calls and processing events.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => logService.clearLogs()} className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Clear History">
                <TrashIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-3 bg-slate-50/50">
            {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <LogIcon className="h-16 w-16 mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">The console is silent...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Responsive list instead of table */}
                    {logs.map(log => (
                        <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getLogTypeStyles(log.type)}`}>
                                    {log.type}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                    {log.timestamp.toLocaleTimeString('en-US', { hour12: false })}.{String(log.timestamp.getMilliseconds()).padStart(3, '0')}
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-slate-800 font-mono leading-relaxed break-words whitespace-pre-wrap">
                                {log.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

import { LogIcon } from './icons/LogIcon';
export default LogViewer;
