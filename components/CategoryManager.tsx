import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Check, 
    X, 
    Tags, 
    AlertCircle,
    Info,
    Hash
} from 'lucide-react';
import { Expense } from '../types';

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
        setError("Definition already exists or is invalid.");
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (usedCategories.has(categoryToDelete)) return;
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
  };

  const handleEditStart = (category: string) => {
    setEditingCategory(category);
    setEditingText(category);
    setError('');
  };
  
  const handleEditSave = () => {
    if (!editingCategory) return;
    const trimmed = editingText.trim();
    if (trimmed && !categories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== editingCategory)) {
        setCategories(prev => prev.map(c => (c === editingCategory ? trimmed : c)));
        setEditingCategory(null);
        setEditingText('');
        setError('');
    } else {
        setError("Label conflict or empty string.");
    }
  };

  return (
    <div className="space-y-10">
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</h3>
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{categories.length} Total</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                    {categories.map((category, index) => (
                        <motion.div 
                            layout
                            key={category}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                                editingCategory === category 
                                ? 'bg-white border-slate-900 shadow-lg ring-4 ring-slate-50' 
                                : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                            }`}
                        >
                            <div className="flex-grow flex items-center gap-3">
                                {editingCategory === category ? (
                                    <input 
                                        type="text" 
                                        value={editingText} 
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="bg-transparent text-sm font-semibold text-slate-900 outline-none w-full"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-slate-700">{category}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {editingCategory === category ? (
                                    <>
                                        <button onClick={handleEditSave} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setEditingCategory(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEditStart(category)} className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCategory(category)} 
                                            disabled={usedCategories.has(category)}
                                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 disabled:hidden transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        {usedCategories.has(category) && (
                                            <div title="In use" className="p-1.5 text-slate-200">
                                                <Info className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>

        <form onSubmit={handleAddCategory} className="pt-8 border-t border-slate-100 relative">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                    <label htmlFor="new-category" className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">New Category</label>
                    <input
                        id="new-category"
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g., Subscriptions"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newCategory.trim()}
                    className="md:mt-6 btn-primary py-2.5 px-6 h-auto"
                >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add
                </button>
            </div>
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 flex items-center gap-2 text-rose-600"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    </div>
  );
};

export default CategoryManager;
