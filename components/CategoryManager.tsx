import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface CategoryManagerProps {
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  categorizedExpenses: Expense[];
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, setCategories, categorizedExpenses }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState('');

  const usedCategories = useMemo(() => {
    return new Set(categorizedExpenses.map(exp => exp.category));
  }, [categorizedExpenses]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (trimmed && !categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategories(prev => [...prev, trimmed]);
      setNewCategory('');
      setError('');
    } else {
        setError("Category cannot be empty or already exist.");
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (usedCategories.has(categoryToDelete)) {
      alert("Cannot delete a category that is already assigned to an expense.");
      return;
    }
    // Removed window.confirm as it could be suppressed and cause the button to do nothing.
    // Deletion is now immediate.
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
  };

  const handleEditStart = (category: string) => {
    setEditingCategory(category);
    setEditingText(category);
  };
  
  const handleEditSave = () => {
    if (!editingCategory) return;

    const trimmed = editingText.trim();
    if (trimmed && !categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        setCategories(prev => prev.map(c => (c === editingCategory ? trimmed : c)));
        setEditingCategory(null);
        setEditingText('');
        setError('');
    } else {
        setError("Category cannot be empty or already exist.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4 bg-white p-4 rounded-lg border">
          {categories.map(category => (
              <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  {editingCategory === category ? (
                      <input 
                          type="text" 
                          value={editingText} 
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-grow p-1 border bg-white rounded-md mr-2"
                          autoFocus
                      />
                  ) : (
                      <span className="text-slate-700">{category}</span>
                  )}
                  <div className="flex items-center gap-2">
                      {editingCategory === category ? (
                          <button onClick={handleEditSave} className="text-green-600 hover:text-green-800">Save</button>
                      ) : (
                          <button onClick={() => handleEditStart(category)} className="text-slate-500 hover:text-indigo-600"><PencilIcon /></button>
                      )}
                      <button 
                          onClick={() => handleDeleteCategory(category)} 
                          disabled={usedCategories.has(category)}
                          className="text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed hover:text-red-600"
                          title={usedCategories.has(category) ? "Cannot delete category in use" : "Delete category"}
                      >
                          <TrashIcon />
                      </button>
                  </div>
              </div>
          ))}
      </div>

      <form onSubmit={handleAddCategory} className="mt-6 border-t pt-6">
        <label htmlFor="new-category" className="block text-sm font-medium text-slate-700">Add New Category</label>
        <div className="mt-1 flex gap-2">
          <input
            id="new-category"
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g., Subscriptions"
            className="flex-grow p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default CategoryManager;