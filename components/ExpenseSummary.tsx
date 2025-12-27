import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Expense } from '../types';
import { getCategoryColor } from '../utils/colorUtils';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { FilterIcon } from './icons/FilterIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface ExpenseSummaryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ expenses, onDeleteExpense }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') {
      return expenses;
    }
    return expenses.filter(expense => expense.category === filterCategory);
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
  
  const renderEmptyState = () => (
     <div className="text-center py-10">
        <p className="text-slate-500">
            {expenses.length === 0 
                ? "No expenses found for this period." 
                : `No expenses found for the "${filterCategory}" category.`}
        </p>
        <p className="text-sm text-slate-400">
            {expenses.length === 0
                ? "Your categorized expenses for this date range will appear here."
                : "Try selecting a different category or 'All'."}
        </p>
    </div>
  );

  if (expenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b pb-3">Expense History</h2>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-2xl font-semibold text-slate-700">Expense History</h2>
            
            {availableCategories.length > 2 && (
                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <FilterIcon className="h-4 w-4" />
                        <span>{filterCategory}</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-10 py-1 max-h-60 overflow-y-auto">
                            {availableCategories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => handleSelectFilter(cat)}
                                    className={`w-full text-left px-4 py-2 text-sm ${filterCategory === cat ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {filteredExpenses.length === 0 ? renderEmptyState() : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredExpenses.slice().reverse().map(expense => {
                const color = getCategoryColor(expense.category);
                return (
                    <li key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                        <div className="flex-grow mr-4">
                            <p className="font-semibold text-slate-800">{expense.merchant}</p>
                            <p className="text-sm text-slate-500">{new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                           <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${color.bg} ${color.text}`}>
                              {expense.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="font-medium text-slate-700 text-right">₹{expense.amount.toFixed(2)}</p>
                            <button
                                onClick={() => handleOpenConfirm(expense)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                aria-label={`Delete expense from ${expense.merchant}`}
                                title="Delete Expense"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </li>
                )
            })}
            </ul>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={
          expenseToDelete && (
            <>
              Are you sure you want to delete the transaction from{" "}
              <strong>{expenseToDelete.merchant}</strong> for{" "}
              <strong>₹{expenseToDelete.amount.toFixed(2)}</strong>?
              <br />
              This action cannot be undone.
            </>
          )
        }
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default ExpenseSummary;
