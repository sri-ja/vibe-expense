
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ClipboardList, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    Circle, 
    Rocket, 
    Flag, 
    Calendar,
    Sparkles,
    Trash
} from 'lucide-react';
import { RoadmapItem } from '../types';

interface RoadmapManagerProps {
  roadmap: RoadmapItem[];
  setRoadmap: React.Dispatch<React.SetStateAction<RoadmapItem[]>>;
}

const RoadmapManager: React.FC<RoadmapManagerProps> = ({ roadmap, setRoadmap }) => {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newItem: RoadmapItem = {
      id: crypto.randomUUID(),
      text: newNote.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setRoadmap(prev => [newItem, ...prev]);
    setNewNote('');
  };

  const handleToggleComplete = (id: string) => {
    setRoadmap(prev => prev.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setRoadmap(prev => prev.filter(item => item.id !== id));
  };

  const sortedRoadmap = [...roadmap].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.isCompleted ? 1 : -1;
  });

  return (
    <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategic Roadmap</h3>
                </div>
                <p className="text-sm text-slate-500"> 
                    Plan upcoming features and improvements.
                </p>
            </div>
            
            <form onSubmit={handleAddNote} className="flex-grow max-w-md">
                <div className="relative group">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a roadmap item..."
                        className="w-full pl-5 pr-14 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-slate-400 outline-none shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newNote.trim()}
                        className="absolute right-1.5 top-1.5 p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-20 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
                {sortedRoadmap.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 text-center"
                    >
                        <Sparkles className="h-8 w-8 mb-4 opacity-50" />
                        <p className="text-xs font-medium uppercase tracking-wider">Roadmap is empty</p>
                    </motion.div>
                ) : (
                    sortedRoadmap.map((item, index) => (
                        <motion.div 
                            layout
                            key={item.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all relative group ${
                                item.isCompleted 
                                ? 'border-slate-100 opacity-60' 
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            <div className="flex items-center gap-4 flex-grow">
                                <button 
                                    onClick={() => handleToggleComplete(item.id)}
                                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                                        item.isCompleted 
                                        ? 'bg-emerald-100 text-emerald-600' 
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </button>
                                
                                <div>
                                    <span className={`text-sm font-medium ${
                                        item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                                    }`}>
                                        {item.text}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="text-[10px] font-medium text-slate-400">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        {item.isCompleted && (
                                            <>
                                                <div className="h-1 w-1 bg-slate-200 rounded-full" />
                                                <span className="text-[10px] font-medium text-emerald-600">Completed</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
                                aria-label="Delete item"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default RoadmapManager;
