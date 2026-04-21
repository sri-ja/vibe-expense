
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
    Lightbulb, 
    X, 
    Calendar, 
    ChevronRight, 
    Sparkles, 
    AlertCircle,
    Info
} from 'lucide-react';
import { Expense } from '../types';
import { getSpendingInsights } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { getStartOfWeek, toLocalDateString } from '../utils/dateUtils';

interface InsightsProps {
  onClose: () => void;
  allExpenses: Expense[];
}

const Insights: React.FC<InsightsProps> = ({ onClose, allExpenses }) => {
    const today = new Date();
    const firstDayOfMonth = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    const lastDayOfMonth = toLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insightsResult, setInsightsResult] = useState<string | null>(null);

    const filteredExpenses = useMemo(() => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        return allExpenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });
    }, [allExpenses, startDate, endDate]);

    const handleSetDateRange = (preset: 'this-week' | 'last-week' | 'this-month' | 'last-month') => {
        const today = new Date();
        let start: Date;
        let end: Date;

        switch (preset) {
            case 'this-week':
                start = getStartOfWeek(today);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'last-week':
                const lastWeekDate = new Date();
                lastWeekDate.setDate(today.getDate() - 7);
                start = getStartOfWeek(lastWeekDate);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'this-month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last-month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
        }

        setStartDate(toLocalDateString(start));
        setEndDate(toLocalDateString(end));
    };

    const handleGenerateInsights = async () => {
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after the end date.');
            return;
        }
        if (filteredExpenses.length === 0) {
            setError('There are no expenses in the selected date range to analyze.');
            setInsightsResult(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        setInsightsResult(null);

        try {
            const result = await getSpendingInsights(filteredExpenses);
            setInsightsResult(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

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
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Spending Insights</h2>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">AI-powered financial analysis</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis Range</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                            {['this-week', 'last-week', 'this-month', 'last-month'].map((preset) => (
                                <button 
                                    key={preset}
                                    onClick={() => handleSetDateRange(preset as any)} 
                                    className="px-3 py-2 rounded-lg font-medium text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-200 hover:border-slate-400 transition-all text-center"
                                >
                                    {preset.replace('-', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-slate-400 transition-all"
                                />
                            </div>
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider ml-1">End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-slate-400 transition-all"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateInsights}
                            disabled={isLoading}
                            className="w-full mt-6 btn-primary py-3 flex items-center justify-center gap-3 transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <SpinnerIcon className="h-4 w-4 text-white animate-spin" />
                                    Analyzing Data...
                                </>
                            ) : (
                                <>
                                    Generate Insights ({filteredExpenses.length} records)
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="min-h-[200px]">
                         <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600"
                                >
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <p className="text-xs font-medium">{error}</p>
                                </motion.div>
                            )}
                            
                            {insightsResult && !isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm markdown-body"
                                >
                                    <div className="prose prose-slate prose-sm max-w-none">
                                        <ReactMarkdown>{insightsResult}</ReactMarkdown>
                                    </div>
                                </motion.div>
                            )}
                            
                            {!insightsResult && !isLoading && !error && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Ready for analysis</p>
                                    <p className="text-xs text-slate-300 mt-1">Select a date range to generate spending insights.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Insights;
