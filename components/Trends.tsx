
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Expense } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { aggregateMultiCategoryExpenses, formatTrendDate } from '../utils/trendsUtils';
import { getCategoryColor } from '../utils/colorUtils';
import { getSpendingInsights } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { getStartOfWeek, toLocalDateString, formatDateRange } from '../utils/dateUtils';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';


// =================================================================================
// Tab Button Helper Component
// =================================================================================
const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            isActive 
            ? 'text-indigo-600 border-indigo-600' 
            : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
        }`}
        role="tab"
        aria-selected={isActive}
    >
        {icon}
        {label}
    </button>
);


// =================================================================================
// Trends Content (Internal Component)
// =================================================================================
const TrendsTooltip = ({ active, payload, label, period }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = formatTrendDate(label, period);
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800 mb-2">{formattedDate}</p>
        {payload.map((pld: any) => (
             <p key={pld.dataKey} style={{ color: pld.stroke }} className="text-sm">
                {`${pld.name}: ₹${pld.value.toFixed(2)}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendsContent: React.FC<{ expenses: Expense[]; categories: string[]; }> = ({ expenses, categories }) => {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['overall']);
    const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
    const categorySelectorRef = useRef<HTMLDivElement>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // Reset to today when changing view mode for a better UX
        setCurrentDate(new Date());
    }, [period]);
    
    const { dateRange, displayDate } = useMemo(() => {
        let start: Date, end: Date, display: string;
    
        if (period === 'day') { // Paginated by week
            start = getStartOfWeek(currentDate);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            display = formatDateRange(start, end);
        } else if (period === 'week') { // Paginated by month
            start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            display = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else { // 'month' view, paginated by year
            start = new Date(currentDate.getFullYear(), 0, 1);
            end = new Date(currentDate.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const navigatePeriod = (direction: 'prev' | 'next') => {
        const increment = direction === 'next' ? 1 : -1;
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (period === 'day') { // by week
                newDate.setDate(newDate.getDate() + (7 * increment));
            } else if (period === 'week') { // by month
                newDate.setMonth(newDate.getMonth() + increment, 1); // Use day 1 to avoid month-end issues
            } else { // 'month' view, by year
                newDate.setFullYear(newDate.getFullYear() + increment);
            }
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
                
                if (newSelection.length === 0) {
                    return ['overall'];
                }
                return newSelection;
            });
        }
    };

    const getButtonLabel = () => {
        if (selectedCategories.includes('overall')) return 'Overall Spending';
        if (selectedCategories.length === 1) return selectedCategories[0];
        return `${selectedCategories.length} categories selected`;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-center mb-4">
                <button onClick={() => navigatePeriod('prev')} className="p-2 rounded-full hover:bg-slate-200 text-slate-600" title="Previous Period">
                    <ChevronLeftIcon />
                </button>
                <span className="font-semibold text-slate-700 mx-4 w-48 text-center">{displayDate}</span>
                <button onClick={() => navigatePeriod('next')} className="p-2 rounded-full hover:bg-slate-200 text-slate-600" title="Next Period">
                    <ChevronRightIcon />
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="p-1 bg-slate-200 rounded-full flex text-sm">
                    <button onClick={() => setPeriod('day')} className={`px-3 py-1 rounded-full font-semibold transition-colors ${period === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Daily</button>
                    <button onClick={() => setPeriod('week')} className={`px-3 py-1 rounded-full font-semibold transition-colors ${period === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Weekly</button>
                    <button onClick={() => setPeriod('month')} className={`px-3 py-1 rounded-full font-semibold transition-colors ${period === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'}`}>Monthly</button>
                </div>
                <div className="relative w-full sm:w-64" ref={categorySelectorRef}>
                    <button onClick={() => setIsCategorySelectorOpen(!isCategorySelectorOpen)} className="w-full flex items-center justify-between p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                        <span className="text-slate-700">{getButtonLabel()}</span>
                        <svg className={`h-5 w-5 text-slate-400 transition-transform ${isCategorySelectorOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {isCategorySelectorOpen && (
                         <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                            <div onClick={() => handleCategoryToggle('overall')} className="flex items-center gap-3 w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 cursor-pointer">
                                <input type="checkbox" checked={selectedCategories.includes('overall')} readOnly className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"/>
                                <span>Overall Spending</span>
                            </div>
                            {categories.sort().map(cat => (
                                <div key={cat} onClick={() => handleCategoryToggle(cat)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 cursor-pointer">
                                    <input type="checkbox" checked={selectedCategories.includes(cat)} readOnly className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span>{cat}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow">
               {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(tick) => formatTrendDate(tick, period)} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} width={80} />
                            <Tooltip content={<TrendsTooltip period={period} />} />
                            <Legend />
                            {selectedCategories.map(category => {
                                const color = getCategoryColor(category);
                                return <Line key={category} name={category === 'overall' ? 'Overall' : category} type="monotone" dataKey={category} stroke={color.hex} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />;
                            })}
                        </LineChart>
                    </ResponsiveContainer>
               ) : (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <p className="text-slate-500">No data to display for this period.</p>
                            <p className="text-sm text-slate-400">Categorize expenses or select a different period.</p>
                        </div>
                    </div>
               )}
            </div>
        </div>
    );
};


// =================================================================================
// Insights Content (Internal Component)
// =================================================================================
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
    
    const parseInlineMarkdown = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.filter(part => part).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    
    const renderFormattedText = (text: string) => {
        const lines = text.split('\n');
        // Fix: Use React.ReactNode instead of JSX.Element to resolve namespace error
        const elements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];

        const closeList = () => {
            if (listItems.length > 0) {
                elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
                listItems = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                listItems.push(<li key={`li-${index}`} className="text-slate-600">{parseInlineMarkdown(trimmedLine.substring(2))}</li>);
            } else {
                closeList();
                if (trimmedLine.startsWith('### ')) {
                    elements.push(<h3 key={`h3-${index}`} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{parseInlineMarkdown(trimmedLine.substring(4))}</h3>);
                } else if (trimmedLine) {
                    elements.push(<p key={`p-${index}`} className="text-slate-600 mb-2">{parseInlineMarkdown(line)}</p>);
                }
            }
        });
        closeList();
        return elements;
    };

    return (
        <div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Select date range for analysis:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <button onClick={() => handleSetDateRange('this-week')} className="w-full text-sm py-1.5 px-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">This Week</button>
                    <button onClick={() => handleSetDateRange('last-week')} className="w-full text-sm py-1.5 px-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Last Week</button>
                    <button onClick={() => handleSetDateRange('this-month')} className="w-full text-sm py-1.5 px-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">This Month</button>
                    <button onClick={() => handleSetDateRange('last-month')} className="w-full text-sm py-1.5 px-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Last Month</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-xs text-slate-500">Start Date</label>
                        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="end-date" className="block text-xs text-slate-500">End Date</label>
                        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md" />
                    </div>
                </div>
            </div>
            <div className="mt-6">
                <button onClick={handleGenerateInsights} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
                    {isLoading ? (<><SpinnerIcon className="h-5 w-5 text-white" />Generating Insights...</>) : (`Analyze ${filteredExpenses.length} Expenses`)}
                </button>
            </div>
            <div className="mt-6">
                {error && <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">{error}</div>}
                {insightsResult && !isLoading && <div className="bg-white p-5 rounded-lg border border-slate-200">{renderFormattedText(insightsResult)}</div>}
                {!insightsResult && !isLoading && !error && <div className="text-center py-10"><p className="text-slate-500">Your spending analysis will appear here.</p></div>}
            </div>
        </div>
    );
};


// =================================================================================
// Main Analysis Modal Component
// =================================================================================
interface TrendsProps {
  onClose: () => void;
  initialTab: 'trends' | 'insights';
  expenses: Expense[];
  categories: string[];
}

const Trends: React.FC<TrendsProps> = ({ onClose, initialTab, expenses, categories }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-800">Analysis</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl leading-none">&times;</button>
                </div>
                
                <div className="flex gap-2 px-4 border-b border-slate-200 bg-white" role="tablist">
                    <TabButton 
                        icon={<ChartBarIcon className="h-5 w-5"/>} 
                        label="Trends" 
                        isActive={activeTab === 'trends'} 
                        onClick={() => setActiveTab('trends')} 
                    />
                    <TabButton 
                        icon={<SparklesIcon className="h-5 w-5"/>} 
                        label="Insights" 
                        isActive={activeTab === 'insights'} 
                        onClick={() => setActiveTab('insights')} 
                    />
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    {activeTab === 'trends' && <TrendsContent expenses={expenses} categories={categories} />}
                    {activeTab === 'insights' && <InsightsContent allExpenses={expenses} />}
                </div>
            </div>
        </div>
    );
};

export default Trends;
