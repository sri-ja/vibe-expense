
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { getSpendingInsights } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
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
    
    // Helper to parse inline markdown like **bold** text.
    const parseInlineMarkdown = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\*\*.*?\*\*)/g); // Split by bold tags, keeping them
        return parts.filter(part => part).map((part, index) => { // Filter out empty strings
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    
    // Simple markdown-to-HTML renderer
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
                listItems.push(
                    <li key={`li-${index}`} className="text-slate-600">
                        {parseInlineMarkdown(trimmedLine.substring(2))}
                    </li>
                );
            } else {
                closeList(); // End of a list block
                if (trimmedLine.startsWith('### ')) {
                    elements.push(
                        <h3 key={`h3-${index}`} className="text-lg font-semibold text-slate-800 mt-4 mb-2">
                            {parseInlineMarkdown(trimmedLine.substring(4))}
                        </h3>
                    );
                } else if (trimmedLine) { // Don't render empty paragraphs
                    elements.push(
                        <p key={`p-${index}`} className="text-slate-600 mb-2">
                            {parseInlineMarkdown(line)}
                        </p>
                    );
                }
            }
        });
        
        closeList(); // Close any remaining list at the end of the text

        return elements;
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <LightbulbIcon className="h-6 w-6 text-indigo-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Spending Insights</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl leading-none">&times;</button>
                </div>

                {/* Content */}
                <div className="flex-grow p-6 overflow-y-auto">
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
                                <input 
                                    type="date" 
                                    id="start-date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md"
                                />
                            </div>
                             <div>
                                <label htmlFor="end-date" className="block text-xs text-slate-500">End Date</label>
                                <input 
                                    type="date" 
                                    id="end-date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button 
                            onClick={handleGenerateInsights}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <SpinnerIcon className="h-5 w-5 text-white" />
                                    Generating Insights...
                                </>
                            ) : (
                                `Analyze ${filteredExpenses.length} Expenses`
                            )}
                        </button>
                    </div>

                    <div className="mt-6">
                        {error && <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">{error}</div>}
                        
                        {insightsResult && !isLoading && (
                            <div className="bg-white p-5 rounded-lg border border-slate-200">
                                {renderFormattedText(insightsResult)}
                            </div>
                        )}
                        
                        {!insightsResult && !isLoading && !error && (
                            <div className="text-center py-10">
                                <p className="text-slate-500">Your spending analysis will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Insights;
