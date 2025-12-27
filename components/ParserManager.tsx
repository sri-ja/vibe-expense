
import React, { useState } from 'react';
import { CustomParser } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface ParserManagerProps {
  customParsers: CustomParser[];
  setCustomParsers: React.Dispatch<React.SetStateAction<CustomParser[]>>;
}

const BUILT_IN_PARSERS = [
    { name: "Jupiter", example: "You paid ₹361\nPaid to\nBLINKIT\n..." },
    { name: "Axis", example: "Amount Debited:\nINR 245.00\nDate: 11-09-25\n..." },
];

const ParserManager: React.FC<ParserManagerProps> = ({ customParsers, setCustomParsers }) => {
  const [newName, setNewName] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [parserToDelete, setParserToDelete] = useState<CustomParser | null>(null);

  const handleAddParser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedTemplate = newTemplate.trim();

    if (!trimmedName || !trimmedTemplate) {
        setError("Both name and template are required.");
        return;
    }
    if (!trimmedTemplate.includes('{merchant}') || !trimmedTemplate.includes('{amount}') || !trimmedTemplate.includes('{date}')) {
        setError("Template must include {merchant}, {amount}, and {date} placeholders.");
        return;
    }

    setCustomParsers(prev => [...prev, { id: crypto.randomUUID(), name: trimmedName, template: trimmedTemplate }]);
    setNewName('');
    setNewTemplate('');
    setError('');
  };

  const handleConfirmDelete = () => {
    if (parserToDelete) setCustomParsers(prev => prev.filter(p => p.id !== parserToDelete.id));
    setParserToDelete(null);
    setIsConfirmOpen(false);
  };

  return (
    <>
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 order-2 lg:order-1">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Saved Formats</h3>
                <div className="space-y-4">
                    {BUILT_IN_PARSERS.map(p => (
                        <div key={p.name} className="p-4 bg-slate-100 rounded-2xl">
                            <p className="font-bold text-slate-700 text-sm">{p.name} <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">System</span></p>
                            <pre className="mt-2 text-[11px] text-slate-500 whitespace-pre-wrap font-mono leading-tight">{p.example}</pre>
                        </div>
                    ))}
                    {customParsers.map(p => (
                        <div key={p.id} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-indigo-900 text-sm">{p.name}</p>
                                <button onClick={() => { setParserToDelete(p); setIsConfirmOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                            <pre className="text-[11px] text-indigo-700/70 whitespace-pre-wrap font-mono leading-tight bg-white/50 p-2 rounded-lg">{p.template}</pre>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 order-1 lg:order-2">
                <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Custom Rule</h3>
                    <form onSubmit={handleAddParser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Friendly Name</label>
                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Bank SMS" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Message Template</label>
                            <textarea value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} placeholder="You spent {amount} at {merchant} on {date}." rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-mono" />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {['{amount}', '{merchant}', '{date}'].map(tag => (
                                    <code key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">{tag}</code>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                        <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 mt-2">
                            Add New Rule
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Remove Rule" message={parserToDelete && <>Remove <strong>"{parserToDelete.name}"</strong> custom rule?</>} confirmText="Delete" confirmVariant="danger" />
    </>
  );
};

export default ParserManager;
