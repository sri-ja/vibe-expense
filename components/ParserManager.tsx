
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Binary, 
    Plus, 
    Trash2, 
    ShieldCheck, 
    Cpu, 
    Braces, 
    Tag, 
    Info,
    AlertCircle,
    Terminal
} from 'lucide-react';
import { CustomParser } from '../types';
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
        setError("Both name and template are mandatory for initialization.");
        return;
    }
    if (!trimmedTemplate.includes('{merchant}') || !trimmedTemplate.includes('{amount}') || !trimmedTemplate.includes('{date}')) {
        setError("Definition must include {merchant}, {amount}, and {date} logic tokens.");
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
  };    return (
    <>
        <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left Column: List of Parsers */}
            <div className="flex-1 space-y-8 order-2 lg:order-1 w-full">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Terminal className="h-4 w-4 text-slate-400" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parsing Rules</h3>
                    </div>
                    
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {BUILT_IN_PARSERS.map((p, idx) => (
                                <motion.div 
                                    key={p.name} 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                            {p.name}
                                        </p>
                                        <span className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">System</span>
                                    </div>
                                    <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-mono leading-relaxed bg-white border border-slate-100 p-3 rounded-lg">
                                        {p.example}
                                    </pre>
                                </motion.div>
                            ))}

                            {customParsers.map((p, idx) => (
                                <motion.div 
                                    key={p.id} 
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-center mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                                <Terminal className="h-4 w-4" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                                        </div>
                                        <button 
                                            onClick={() => { setParserToDelete(p); setIsConfirmOpen(true); }} 
                                            className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg relative z-10">
                                        {p.template}
                                    </pre>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {customParsers.length === 0 && (
                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                <Braces className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-[11px] font-medium uppercase tracking-wider">No custom rules</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Add New Parser */}
            <div className="w-full lg:w-96 order-1 lg:order-2 lg:sticky lg:top-0">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <Plus className="h-4 w-4 text-slate-400" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Rule</h3>
                    </div>

                    <form onSubmit={handleAddParser} className="space-y-6">
                        <div>
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                                Name
                            </label>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)} 
                                placeholder="e.g., Bank SMS" 
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm font-medium text-slate-900" 
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                                Pattern
                            </label>
                            <textarea 
                                value={newTemplate} 
                                onChange={(e) => setNewTemplate(e.target.value)} 
                                placeholder="You spent {amount} at {merchant} on {date}." 
                                rows={4} 
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm font-mono text-slate-700 resize-none" 
                            />
                            
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {['{amount}', '{merchant}', '{date}'].map(tag => (
                                    <code key={tag} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{tag}</code>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                                <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Use these tokens to tell the app how to read your transaction text.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-[11px] font-medium">{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn-primary w-full py-3"
                        >
                            Save Rule
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <ConfirmationModal 
            isOpen={isConfirmOpen} 
            onClose={() => setIsConfirmOpen(false)} 
            onConfirm={handleConfirmDelete} 
            title="Delete Rule" 
            message={parserToDelete && <span className="text-slate-600">Remove the <strong>"{parserToDelete.name}"</strong> parsing rule?</span>} 
            confirmText="Delete Rule" 
            confirmVariant="danger" 
        />
    </>
  );
};

export default ParserManager;
