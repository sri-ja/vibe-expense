
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { logService } from '../services/logService';
import { LogEntry, LogType } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { LogIcon } from './icons/LogIcon';

interface LogViewerProps {
  onClose: () => void;
}

const getLogTypeStyles = (type: LogType): string => {
    switch (type) {
        case 'api': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'info': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'error': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
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
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8" 
        onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-50 md:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden relative border border-white/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <LogIcon className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Logs</h2>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Real-time processing events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => logService.clearLogs()} 
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" 
                title="Clear Logs"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
            <button 
                onClick={onClose} 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
                <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
            <AnimatePresence mode="popLayout">
                {logs.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex flex-col items-center justify-center h-full text-center py-20"
                    >
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-200 shadow-sm">
                            <LogIcon className="h-8 w-8" />
                        </div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No activity reported</p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                key={log.id} 
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getLogTypeStyles(log.type)}`}>
                                        {log.type}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                                    {log.message}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LogViewer;
