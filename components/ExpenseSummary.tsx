import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../types';
import { getCategoryColor } from '../utils/colorUtils';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { FilterIcon } from './icons/FilterIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface ExpenseSummaryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  categories: string[];
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ 
  expenses, 
  onDeleteExpense, 
  onUpdateCategory,
  categories 
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const editCategoryRef = useRef<HTMLDivElement>(null);

  const availableCategories = useMemo(() => {
    const uniqueCategories = new Set(expenses.map(e => e.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [expenses]);

  useEffect(() => {
    if (!availableCategories.includes(filterCategory)) {
        setFilterCategory('All');
    }
  }, [availableCategories, filterCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterOpen(false);
        }
        if (editCategoryRef.current && !editCategoryRef.current.contains(event.target as Node)) {
            setEditingCategoryId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterCategory === 'All') {
      return sorted;
    }
    return sorted.filter(expense => expense.category === filterCategory);
  }, [expenses, filterCategory]);

  const handleOpenConfirm = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setExpenseToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
    }
    handleCloseConfirm();
  };
  
  const handleSelectFilter = (category: string) => {
    setFilterCategory(category);
    setIsFilterOpen(false);
  };

  const handleUpdateCategory = (id: string, newCategory: string) => {
    onUpdateCategory(id, newCategory);
    setEditingCategoryId(null);
  };
  
  const renderEmptyState = () => (
     <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-medium text-slate-500">
            {expenses.length === 0 
                ? "No expenses yet" 
                : `No ${filterCategory} expenses`}
        </p>
        <p className="text-xs text-slate-400 mt-1">
            {expenses.length === 0
                ? "Add your first expense to get started."
                : "Try a different filter."}
        </p>
    </div>
  );

  return (
    <>
      <div className="card-premium p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Recent Expenses</h2>
                <p className="text-xs text-slate-400 mt-0.5">{filteredExpenses.length} transactions recorded</p>
            </div>
            
            <div className="flex items-center gap-4">
                {availableCategories.length > 2 && (
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all"
                        >
                            <FilterIcon className="h-3 w-3 opacity-60" />
                            <span>{filterCategory}</span>
                            <ChevronDownIcon className={`h-3 w-3 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1 overflow-hidden"
                                >
                                    <div className="max-h-60 overflow-y-auto">
                                        {availableCategories.map(cat => (
                                            <button 
                                                key={cat}
                                                onClick={() => handleSelectFilter(cat)}
                                                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
        
        <div className="relative">
            {filteredExpenses.length === 0 ? renderEmptyState() : (
                <ul className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredExpenses.map((expense, index) => {
                        const color = getCategoryColor(expense.category);
                        const isEditing = editingCategoryId === expense.id;

                        return (
                            <motion.li 
                                layout
                                key={expense.id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/30 transition-all duration-200"
                            >
                                <div className="flex items-center gap-3.5 flex-grow min-w-0">
                                    <div className={`h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${color.bg} ${color.text}`}>
                                        {expense.merchant.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900 truncate tracking-tight">{expense.merchant}</p>
                                            <div className="relative" ref={isEditing ? editCategoryRef : null}>
                                                <button 
                                                    onClick={() => setEditingCategoryId(isEditing ? null : expense.id)}
                                                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border ${color.bg} ${color.text} ${color.border} hover:opacity-80 transition-all inline-flex items-center gap-1`}
                                                >
                                                    {expense.category}
                                                    <ChevronDownIcon className="h-2 w-2" />
                                                </button>

                                                <AnimatePresence>
                                                    {isEditing && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-[60] p-2"
                                                        >
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                {categories.map(cat => (
                                                                    <button
                                                                        key={cat}
                                                                        onClick={() => handleUpdateCategory(expense.id, cat)}
                                                                        className={`text-left px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all ${expense.category === cat ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                                                    >
                                                                        {cat}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <p className="font-semibold text-slate-900 tracking-tight">
                                        ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    <button
                                        onClick={() => handleOpenConfirm(expense)}
                                        className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </motion.li>
                        )
                    })}
                </AnimatePresence>
                </ul>
            )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message={
          expenseToDelete && (
            <div className="text-center sm:text-left">
              <p className="text-slate-600">Permanently remove record from <span className="text-slate-900 font-bold">{expenseToDelete.merchant}</span>?</p>
              <p className="text-xs text-rose-500 mt-2 font-bold uppercase tracking-widest italic">This operation is irreversible.</p>
            </div>
          )
        }
        confirmText="Confirm Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default ExpenseSummary;
