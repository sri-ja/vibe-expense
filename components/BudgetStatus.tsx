import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    IndianRupee, 
    ShieldAlert, 
    Zap, 
    Compass, 
    Activity,
    Target,
    ArrowRight
} from 'lucide-react';
import { Expense, Budgets } from '../types';

interface BudgetStatusProps {
  expenses: Expense[];
  budgets: Budgets;
}

const ProgressBar: React.FC<{ value: number; max: number; label?: string }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const boundedPercentage = Math.min(percentage, 100);
    
    let colorClass = 'bg-brand-500 shadow-brand-200/50';
    let trackClass = 'bg-slate-100';
    
    if (percentage > 100) {
        colorClass = 'bg-rose-500 shadow-rose-200/50';
        trackClass = 'bg-rose-50';
    } else if (percentage > 85) {
        colorClass = 'bg-amber-500 shadow-amber-200/50';
        trackClass = 'bg-amber-50/50';
    }

    return (
        <div className={`w-full ${trackClass} rounded-full h-1.5 overflow-hidden transition-colors duration-500`}>
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${boundedPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className={`${colorClass} h-full rounded-full transition-all`}
            />
        </div>
    );
};

const BudgetStatus: React.FC<BudgetStatusProps> = ({ expenses, budgets }) => {
    const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);

    const categorySpending = useMemo(() => {
        const spending: { [key: string]: number } = {};
        for (const expense of expenses) {
            spending[expense.category] = (spending[expense.category] || 0) + expense.amount;
        }
        return spending;
    }, [expenses]);
    
    const overallBudget = budgets.overall;
    const hasBudgets = overallBudget || Object.keys(budgets).some(k => k !== 'overall');
    
    if (!hasBudgets) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-premium p-10 flex flex-col items-center justify-center text-center"
            >
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <Target className="h-6 w-6 text-slate-300" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Set Spending Limits</h2>
                <p className="text-xs text-slate-500 max-w-[200px]"> 
                    Configure your monthly goals in settings to track progress.
                </p>
            </motion.div>
        );
    }

    const remaining = overallBudget ? overallBudget - totalSpent : 0;
    const isOverBudget = remaining < 0;
    const utilizationRate = overallBudget ? (totalSpent / overallBudget) * 100 : 0;
    
    const budgetedCategories = Object.keys(budgets).filter(key => key !== 'overall');

    return (
        <div className="card-premium p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Tracking</h2>
                </div>
                <AnimatePresence>
                    {isOverBudget && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-rose-500 flex items-center gap-1.5"
                        >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Over Budget</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {typeof overallBudget === 'number' && (
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Spent Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-semibold tabular-nums tracking-tight ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                                    ₹{totalSpent.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                        <div className="md:text-right">
                             <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Limit</p>
                             <div className="text-xl font-medium text-slate-400">
                                ₹{overallBudget.toLocaleString('en-IN')}
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <ProgressBar value={totalSpent} max={overallBudget} />
                        
                        <div className="flex justify-between items-center py-3">
                             <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isOverBudget ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {isOverBudget 
                                        ? `${Math.abs(utilizationRate - 100).toFixed(1)}% OVER` 
                                        : `${(100 - utilizationRate).toFixed(1)}% remaining`
                                    }
                                </p>
                             </div>
                             <div className="text-[11px] font-bold text-slate-900 tabular-nums">
                                ₹{Math.abs(remaining).toLocaleString('en-IN')} {isOverBudget ? 'over' : 'left'}
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {budgetedCategories.length > 0 && (
                <div className="pt-8 border-t border-slate-100">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-6">Category Limits</h3>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                        {budgetedCategories.map(category => {
                            const spent = categorySpending[category] || 0;
                            const budget = budgets[category]!;
                            const percent = (spent / budget) * 100;
                            return (
                                <div key={category} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900">{category}</span>
                                        <span className={`text-[12px] font-medium tabular-nums ${percent > 100 ? 'text-rose-500' : 'text-slate-500'}`}>
                                            {percent.toFixed(0)}%
                                        </span>
                                    </div>
                                    <ProgressBar value={spent} max={budget} />
                                </div>
                            )
                        })}
                     </div>
                </div>
            )}
        </div>
    );
};

export default BudgetStatus;
