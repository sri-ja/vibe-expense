
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StickyNote, Save, X, Edit2, Tag, Plus, Trash2 } from 'lucide-react';

interface MonthNoteEditorProps {
    monthKey: string; // "YYYY-MM"
    note: string;
    monthCategories: string[];
    onSaveNote: (note: string) => void;
    onSaveCategories: (categories: string[]) => void;
}

const MonthNoteEditor: React.FC<MonthNoteEditorProps> = ({ monthKey, note, monthCategories, onSaveNote, onSaveCategories }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(note);
    const [tempCategories, setTempCategories] = useState<string[]>(monthCategories);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        setContent(note);
        setTempCategories(monthCategories);
    }, [note, monthCategories, monthKey]);

    const handleSave = () => {
        onSaveNote(content);
        onSaveCategories(tempCategories);
        setIsEditing(false);
    };

    const addCategory = () => {
        if (newCategory.trim() && !tempCategories.includes(newCategory.trim())) {
            setTempCategories([...tempCategories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const removeCategory = (cat: string) => {
        setTempCategories(tempCategories.filter(c => c !== cat));
    };

    const monthName = new Date(monthKey + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <AnimatePresence mode="wait">
                {!isEditing ? (
                    <motion.div 
                        key="display"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => setIsEditing(true)}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-20 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:text-slate-900 transition-colors">
                                    <StickyNote className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Context for {monthName}</h3>
                                    </div>
                                    <p className={`text-sm ${content ? 'text-slate-700' : 'text-slate-300 italic'} leading-relaxed font-medium mb-3`}>
                                        {content || "Add a note for this month..."}
                                    </p>
                                    
                                    {monthCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {monthCategories.map(cat => (
                                                <span key={cat} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-tight">
                                                    <Tag className="h-2.5 w-2.5" />
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400">
                                <Edit2 className="h-4 w-4" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="editor"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4 text-slate-900" />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Context & Month Events</h3>
                            </div>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Month Note</label>
                                    <textarea
                                        autoFocus
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Why were expenses higher this month? (e.g. Vacation, Car repair...)"
                                        className="w-full min-h-[150px] bg-slate-50 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Special Categories (Events)</label>
                                    <div className="flex gap-2 mb-3">
                                        <input 
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                            placeholder="e.g. Mumbai Trip, Wedding..."
                                            className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                                        />
                                        <button 
                                            onClick={addCategory}
                                            className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto no-scrollbar py-1">
                                        {tempCategories.length === 0 ? (
                                            <p className="text-[10px] text-slate-300 font-bold italic px-1 pt-2">No special categories added for this month.</p>
                                        ) : (
                                            tempCategories.map(cat => (
                                                <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full group/tag transition-all hover:border-red-200 hover:bg-red-50">
                                                    <span className="text-[11px] font-bold text-slate-700">{cat}</span>
                                                    <button 
                                                        onClick={() => removeCategory(cat)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium px-1 mt-2">These categories will only be available for transactions in {monthName}.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-6">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                            >
                                <Save className="h-4 w-4" />
                                Save Month Details
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MonthNoteEditor;
