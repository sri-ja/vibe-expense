
import React, { useState } from 'react';
import { RoadmapItem } from '../types';
import { TrashIcon } from './icons/TrashIcon';

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
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Roadmap & Future Ideas</h3>
      <p className="text-sm text-slate-500 mb-6">
        Keep track of features you want to add or improvements you're planning.
      </p>

      <form onSubmit={handleAddNote} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g., Add dark mode support..."
            className="flex-grow p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Add Idea
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {sortedRoadmap.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed rounded-xl">
            <p className="text-slate-400">No notes yet. Add your first idea above!</p>
          </div>
        ) : (
          sortedRoadmap.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all duration-200 ${item.isCompleted ? 'opacity-60 grayscale' : 'hover:border-indigo-200'}`}
            >
              <div className="flex items-center gap-4 flex-grow">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggleComplete(item.id)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`text-slate-700 font-medium ${item.isCompleted ? 'line-through' : ''}`}>
                  {item.text}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  aria-label="Delete item"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoadmapManager;
