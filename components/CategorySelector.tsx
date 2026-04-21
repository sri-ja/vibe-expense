
import React from 'react';
import { motion } from 'motion/react';
import { ExpenseCategory } from '../types';
import { getCategoryColor } from '../utils/colorUtils';

interface CategorySelectorProps {
  onSelectCategory: (category: ExpenseCategory) => void;
  categories: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelectCategory, categories }) => {
  return (
    <div className="w-full">
      <h3 className="text-[11px] font-medium text-center text-slate-400 uppercase tracking-widest mb-4">Select Category</h3>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((category, index) => {
            const color = getCategoryColor(category);
            return (
                <motion.button
                  key={category}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectCategory(category)}
                  className={`px-2 py-2 text-[11px] font-medium rounded-lg transition-all border ${color.bg} ${color.text} ${color.border} shadow-sm text-center flex items-center justify-center`}
                >
                  {category}
                </motion.button>
            )
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
