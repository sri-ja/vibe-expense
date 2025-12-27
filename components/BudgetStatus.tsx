import React, { useMemo } from 'react';
import { Expense, Budgets } from '../types';

interface BudgetStatusProps {
  expenses: Expense[];
  budgets: Budgets;
}

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    let colorClass = 'bg-green-500';
    if (percentage > 90) {
        colorClass = 'bg-red-500';
    } else if (percentage > 75) {
        colorClass = 'bg-yellow-500';
    }

    return (
        <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
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
        return null; // Don't render the component if no budgets are set
    }

    const remaining = overallBudget ? overallBudget - totalSpent : 0;
    
    const budgetedCategories = Object.keys(budgets).filter(key => key !== 'overall');

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b pb-3">Budget Status</h2>

            {typeof overallBudget === 'number' && (
                <div className="mb-6">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-slate-600 font-medium">Overall Spending</span>
                        <span className={`font-semibold text-lg ${remaining < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            ₹{totalSpent.toFixed(2)} / ₹{overallBudget.toFixed(2)}
                        </span>
                    </div>
                    <ProgressBar value={totalSpent} max={overallBudget} />
                     <p className={`text-sm text-right mt-1 ${remaining < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                        {remaining >= 0 ? `₹${remaining.toFixed(2)} remaining` : `₹${Math.abs(remaining).toFixed(2)} over budget`}
                    </p>
                </div>
            )}
            
            {budgetedCategories.length > 0 && (
                <div>
                     <h3 className="text-md font-semibold text-slate-600 mb-3">By Category</h3>
                     <div className="space-y-4">
                        {budgetedCategories.map(category => {
                            const spent = categorySpending[category] || 0;
                            const budget = budgets[category]!;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between items-baseline text-sm mb-1">
                                        <span className="font-medium text-slate-600">{category}</span>
                                        <span className="font-medium text-slate-500">₹{spent.toFixed(2)} / ₹{budget.toFixed(2)}</span>
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
