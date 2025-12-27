
import React from 'react';
import { ExpenseCategory } from '../types';

interface CategorySelectorProps {
  onSelectCategory: (category: ExpenseCategory) => void;
  categories: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelectCategory, categories }) => {
  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-center text-slate-400 uppercase tracking-widest mb-4">Choose Category</h3>
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {categories.map(category => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className="px-5 py-3 md:px-6 md:py-2.5 text-sm font-bold rounded-2xl md:rounded-full cursor-pointer transition-all active:scale-95 bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white shadow-sm border border-slate-200 hover:border-indigo-600 flex-grow sm:flex-grow-0 text-center"
            >
              {category}
            </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
