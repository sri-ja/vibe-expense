
import React, { useState, useEffect, useMemo } from 'react';
import { Budgets } from '../types';

interface BudgetManagerProps {
  categories: string[];
  budgets: Budgets;
  setBudgets: React.Dispatch<React.SetStateAction<Budgets>>;
  onClose: () => void; // This will now save and close the entire settings modal
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ categories, budgets, setBudgets, onClose }) => {
  const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
  const [error, setError] = useState('');

  // Make sure "Other" category is always available for budgeting and is sorted to the end.
  const categoriesForBudgeting = useMemo(() => {
    // Fix: Explicitly type the Set as string to avoid 'unknown' types in sort
    const categorySet = new Set<string>(categories);
    categorySet.add('Other');
    return Array.from(categorySet).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        // Fix for Error: Property 'localeCompare' does not exist on type 'unknown'
        return a.localeCompare(b);
    });
  }, [categories]);

  useEffect(() => {
    setLocalBudgets(budgets);
  }, [budgets]);

  const handleBudgetChange = (key: string, value: string) => {
    const newBudgets = { ...localBudgets };
    const amount = value === '' ? undefined : parseFloat(value);
    
    // Update the value for the key that changed. Use 'undefined' if parsing fails or amount is negative.
    newBudgets[key] = (amount !== undefined && !isNaN(amount) && amount >= 0) ? amount : undefined;

    if (key === 'overall') {
        const overallBudget = newBudgets.overall || 0;
        
        // Sum of all categories except 'Other'
        const sumOfSpecificCategories = categoriesForBudgeting
            .filter(cat => cat !== 'Other')
            .reduce((sum, cat) => sum + (newBudgets[cat] || 0), 0);

        const otherBudget = overallBudget - sumOfSpecificCategories;
        
        if (otherBudget < 0) {
            setError('Overall budget is less than the sum of specified category budgets.');
            // When overall is too low, the 'Other' budget is considered 0.
            delete newBudgets['Other'];
        } else {
            setError('');
            // Set 'Other' budget to the remainder. Use undefined for 0.
            newBudgets['Other'] = otherBudget > 0 ? otherBudget : undefined;
        }

    } else { // A category budget was changed
        setError('');
        // Recalculate the overall budget as the sum of all category budgets
        const newOverall = categoriesForBudgeting
            .reduce((sum, cat) => sum + (newBudgets[cat] || 0), 0);
            
        newBudgets.overall = newOverall > 0 ? newOverall : undefined;
    }
    
    setLocalBudgets(newBudgets);
  };

  const handleSave = () => {
    if (error) {
        alert(`Please resolve the error before saving:\n${error}`);
        return;
    }
    // Clean up any empty/zero entries before saving
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
    <div className="w-full max-w-lg mx-auto">
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div>
              <label htmlFor="overall-budget" className="block text-md font-semibold text-slate-700">Overall Monthly Budget</label>
              <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                  <input
                      id="overall-budget"
                      type="number"
                      min="0"
                      placeholder="e.g., 50000"
                      value={localBudgets.overall || ''}
                      onChange={(e) => handleBudgetChange('overall', e.target.value)}
                      className="w-full pl-7 p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
          </div>

          <div className="border-t pt-4">
              <h3 className="text-md font-semibold text-slate-700 mb-2">Category Budgets</h3>
                <div className="space-y-2">
                  {categoriesForBudgeting.map(category => (
                      <div key={category} className="flex items-center justify-between gap-4 p-2 bg-white rounded-lg border">
                          <label htmlFor={`budget-${category}`} className="text-slate-600 font-medium">{category}</label>
                          <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                              <input
                                  id={`budget-${category}`}
                                  type="number"
                                  min="0"
                                  placeholder="Not set"
                                  value={localBudgets[category] || ''}
                                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                                  className="w-40 pl-7 p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
      
      {error && <p className="text-sm text-red-600 mt-4 text-center">{error}</p>}

      <div className="mt-6 border-t pt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save Budgets
        </button>
      </div>
    </div>
  );
};

export default BudgetManager;
