
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { 
    Activity, 
    Lightbulb, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    Calendar,
    Filter,
    TrendingUp,
    BarChart3,
    Check
} from 'lucide-react';
import { Expense } from '../types';
import { aggregateMultiCategoryExpenses, formatTrendDate } from '../utils/trendsUtils';
import { getCategoryColor } from '../utils/colorUtils';
import { getStartOfWeek, toLocalDateString, formatDateRange } from '../utils/dateUtils';
import Insights from './Insights';

interface TrendsProps {
  onClose: () => void;
  initialTab: 'trends' | 'insights';
  expenses: Expense[];
  categories: string[];
}

const TrendsTooltip = ({ active, payload, label, period }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = formatTrendDate(label, period);
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-1.5">{formattedDate}</p>
        <div className="space-y-1.5">
            {payload.map((pld: any) => (
                <div key={pld.dataKey} className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pld.stroke || pld.fill }} />
                        {pld.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-900 tabular-nums">
                        ₹{pld.value.toLocaleString('en-IN')}
                    </span>
                </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

const SpendingTrends: React.FC<{ expenses: Expense[]; categories: string[]; }> = ({ expenses, categories }) => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['overall']);
    const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
    const categorySelectorRef = useRef<HTMLDivElement>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        setCurrentDate(new Date());
    }, [period]);
    
    const { dateRange, displayDate } = useMemo(() => {
        let start: Date, end: Date, display: string;
        if (period === 'day') {
            start = getStartOfWeek(currentDate);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            display = formatDateRange(start, end);
        } else if (period === 'week') {
            start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            display = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else {
            start = new Date(currentDate.getFullYear(), 0, 1);
            end = new Date(currentDate.getFullYear(), 11, 31);
            display = currentDate.getFullYear().toString();
        }
        return { dateRange: { start, end }, displayDate: display };
    }, [currentDate, period]);

    const filteredExpensesForPeriod = useMemo(() => {
        return expenses.filter(e => {
            const [year, month, day] = e.date.split('-').map(Number);
            const expenseDate = new Date(year, month - 1, day);
            return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
        });
    }, [expenses, dateRange]);

    const trendData = useMemo(() => {
        return aggregateMultiCategoryExpenses(filteredExpensesForPeriod, selectedCategories, period);
    }, [filteredExpensesForPeriod, selectedCategories, period]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categorySelectorRef.current && !categorySelectorRef.current.contains(event.target as Node)) {
                setIsCategorySelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigatePeriod = (direction: 'prev' | 'next') => {
        const increment = direction === 'next' ? 1 : -1;
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (period === 'day') newDate.setDate(newDate.getDate() + (7 * increment));
            else if (period === 'week') newDate.setMonth(newDate.getMonth() + increment, 1);
            else newDate.setFullYear(newDate.getFullYear() + increment);
            return newDate;
        });
    };

    const handleCategoryToggle = (category: string) => {
        if (category === 'overall') {
            setSelectedCategories(['overall']);
        } else {
            setSelectedCategories(prev => {
                const isSelected = prev.includes(category);
                const newSelection = isSelected 
                    ? prev.filter(c => c !== category)
                    : [...prev.filter(c => c !== 'overall'), category];
                return newSelection.length === 0 ? ['overall'] : newSelection;
            });
        }
    };

    return (
        <div className="h-full flex flex-col pt-2">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                    {[
                        { id: 'day', label: 'Day' },
                        { id: 'week', label: 'Week' },
                        { id: 'month', label: 'Month' }
                    ].map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setPeriod(p.id as any)} 
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all ${period === p.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <button onClick={() => navigatePeriod('prev')} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                        <ChevronLeft className="h-4 w-4 text-slate-400" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">{displayDate}</span>
                    <button onClick={() => navigatePeriod('next')} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                </div>

                <div className="relative w-full md:w-64" ref={categorySelectorRef}>
                    <button 
                        onClick={() => setIsCategorySelectorOpen(!isCategorySelectorOpen)} 
                        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-400 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">
                                {selectedCategories.includes('overall') ? 'All Spending' : `${selectedCategories.length} Selected`}
                            </span>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 text-slate-300 transition-transform ${isCategorySelectorOpen ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isCategorySelectorOpen && (
                             <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[110] p-1.5"
                             >
                                <button 
                                    onClick={() => handleCategoryToggle('overall')} 
                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-all ${selectedCategories.includes('overall') ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="font-medium">Overall Spending</span>
                                    {selectedCategories.includes('overall') && <Check className="h-3 w-3" />}
                                </button>
                                <div className="h-px bg-slate-100 my-1.5" />
                                <div className="max-h-60 overflow-y-auto">
                                    {categories.sort().map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => handleCategoryToggle(cat)} 
                                            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-all ${selectedCategories.includes(cat) ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <span>{cat}</span>
                                            {selectedCategories.includes(cat) && <Check className="h-3 w-3" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex-grow min-h-[400px]">
               {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                {selectedCategories.map(cat => {
                                    const color = getCategoryColor(cat);
                                    return (
                                        <linearGradient key={`grad-${cat}`} id={`fill-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color.hex} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={color.hex} stopOpacity={0}/>
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(tick) => formatTrendDate(tick, period)} 
                                dy={10}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `₹${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`} 
                                width={50} 
                            />
                            <Tooltip content={<TrendsTooltip period={period} />} />
                            {selectedCategories.map(category => {
                                const color = getCategoryColor(category);
                                return (
                                    <Area 
                                        key={category} 
                                        name={category === 'overall' ? 'Overall' : category} 
                                        type="monotone" 
                                        dataKey={category} 
                                        stroke={color.hex} 
                                        strokeWidth={2} 
                                        fill={`url(#fill-${category})`}
                                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
               ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                             <BarChart3 className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No data to display</p>
                    </motion.div>
               )}
            </div>
        </div>
    );
};

const Trends: React.FC<TrendsProps> = ({ onClose, initialTab, expenses, categories }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    
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
                className="bg-slate-50 md:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <TrendingUp className="h-5 w-5" />
                         </div>
                         <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Analysis</h2>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Spending trends & automated insights</p>
                         </div>
                    </div>
                    
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('trends')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'trends' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Trends
                        </button>
                        <button 
                            onClick={() => setActiveTab('insights')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'insights' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Lightbulb className="h-3.5 w-3.5" />
                            Insights
                        </button>
                    </div>

                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'trends' ? (
                            <motion.div 
                                key="trends-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <SpendingTrends expenses={expenses} categories={categories} />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="insights-tab"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                <InsightsContent allExpenses={expenses} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Re-implementing InsightsContent within Trends for backward compatibility with App.tsx state management if needed, 
// using the refined logic from our separate Insights file.
import ReactMarkdown from 'react-markdown';
import { Sparkles, Info, AlertCircle } from 'lucide-react';
import { getSpendingInsights } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';

const InsightsContent: React.FC<{ allExpenses: Expense[]; }> = ({ allExpenses }) => {
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

    const handleGenerateInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getSpendingInsights(filteredExpenses);
            setInsightsResult(result);
        } catch (err: any) {
            setError(err.message || 'Analysis failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis Range</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-slate-400 transition-all" />
                    </div>
                </div>

                <button 
                    onClick={handleGenerateInsights}
                    disabled={isLoading || filteredExpenses.length === 0}
                    className="w-full btn-primary h-auto py-3 text-sm flex items-center justify-center gap-2"
                >
                    {isLoading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : `Analyze ${filteredExpenses.length} Records`}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {insightsResult && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <Info className="h-4 w-4 text-slate-400" />
                            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Analysis Result</h3>
                        </div>
                        <div className="prose prose-slate prose-sm max-w-none">
                             <ReactMarkdown>{insightsResult}</ReactMarkdown>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Trends;
