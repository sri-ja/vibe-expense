
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Target, 
    Layers, 
    IndianRupee, 
    Save, 
    AlertCircle,
    CheckCircle2,
    Calculator,
    Infinity
} from 'lucide-react';
import { Budgets } from '../types';

interface BudgetManagerProps {
  categories: string[];
  budgets: Budgets;
  setBudgets: React.Dispatch<React.SetStateAction<Budgets>>;
  onClose: () => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ categories, budgets, setBudgets, onClose }) => {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
  const [error, setError] = useState('');

  const categoriesForBudgeting = useMemo(() => {
    const categorySet = new Set<string>(categories);
    categorySet.add('Other');
    return Array.from(categorySet).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
    });
  }, [categories]);

  useEffect(() => {
    setLocalBudgets(budgets);
  }, [budgets]);

  const handleBudgetChange = (key: string, value: string) => {
    const newBudgets = { ...localBudgets };
    const amount = value === '' ? undefined : parseFloat(value);
    newBudgets[key] = (amount !== undefined && !isNaN(amount) && amount >= 0) ? amount : undefined;

    if (key === 'overall') {
        const overallBudget = newBudgets.overall || 0;
        const sumOfSpecificCategories = categoriesForBudgeting
            .filter(cat => cat !== 'Other')
            .reduce((sum, cat) => sum + (newBudgets[cat] || 0), 0);
        const otherBudget = overallBudget - sumOfSpecificCategories;
        
        if (otherBudget < 0) {
            setError('Global limit is less than the sum of category allocations.');
            delete newBudgets['Other'];
        } else {
            setError('');
            newBudgets['Other'] = otherBudget > 0 ? otherBudget : undefined;
        }
    } else {
        setError('');
        const newOverall = categoriesForBudgeting
            .reduce((sum, cat) => sum + (newBudgets[cat] || 0), 0);
        newBudgets.overall = newOverall > 0 ? newOverall : undefined;
    }
    setLocalBudgets(newBudgets);
  };

  const handleSave = () => {
    if (error) return;
    const cleanedBudgets: Budgets = {};
    for (const key in localBudgets) {
        const value = localBudgets[key];
        if (value !== undefined && value !== null && !isNaN(value) && value > 0) {
            cleanedBudgets[key] = value;
        }
    }
    setBudgets(cleanedBudgets);
    onClose();
  };

  return (
    <div className="space-y-10">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Target className="h-24 w-24 text-slate-400" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <Infinity className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Budget</h3>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-grow max-w-sm">
                        <label htmlFor="overall-budget" className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Set Overall Limit</label>
                        <div className="relative group">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                id="overall-budget"
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={localBudgets.overall || ''}
                                onChange={(e) => handleBudgetChange('overall', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-3xl font-bold text-slate-900 focus:border-slate-400 transition-all outline-none tabular-nums"
                            />
                        </div>
                    </div>
                    
                    <div className="hidden md:block">
                        <div className="px-4 py-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                {localBudgets.overall && !error ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs font-semibold text-emerald-600">Active</span>
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="h-4 w-4 text-amber-500" />
                                        <span className="text-xs font-semibold text-amber-600">Pending</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</h3>
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{categoriesForBudgeting.length} Items</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                    {categoriesForBudgeting.map((category, index) => (
                        <motion.div 
                            key={category}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                        >
                            <div className="flex-grow">
                                <p className="text-xs font-semibold text-slate-700">{category}</p>
                            </div>
                            <div className="relative w-32">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    id={`budget-${category}`}
                                    type="number"
                                    min="0"
                                    placeholder="No limit"
                                    value={localBudgets[category] || ''}
                                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-400 transition-all outline-none tabular-nums"
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
        
        <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600"
                >
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <p className="text-xs font-medium text-rose-600">{error}</p>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex justify-end pt-8 border-t border-slate-100">
            <button
                onClick={handleSave}
                disabled={!!error}
                className="btn-primary px-8 py-3 h-auto text-sm"
            >
                <Save className="h-4 w-4 inline mr-2" />
                Save Budgets
            </button>
        </div>
    </div>
  );
};

export default BudgetManager;
