
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Plus, 
    Trash2, 
    Camera, 
    Image as ImageIcon, 
    Zap, 
    BrainCircuit,
    History,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface MessageProcessorProps {
    onProcess: () => Promise<void>;
    isProcessing: boolean;
    error: string | null;
    onScanReceipt: () => void;
    onUploadReceipt: () => void;
    onClose: () => void;
    transactionTexts: string[];
    setTransactionTexts: React.Dispatch<React.SetStateAction<string[]>>;
}

const MessageProcessor: React.FC<MessageProcessorProps> = ({ onProcess, isProcessing, error, onScanReceipt, onUploadReceipt, onClose, transactionTexts, setTransactionTexts }) => {
    const [currentText, setCurrentText] = useState('');

    const handleAddText = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedText = currentText.trim();
        if (trimmedText) {
            setTransactionTexts(prev => [trimmedText, ...prev]);
            setCurrentText('');
        }
    };

    const handleRemoveText = (index: number) => {
        setTransactionTexts(prev => prev.filter((_, i) => i !== index));
    };

    const handleProcessAll = () => {
        if (transactionTexts.length > 0) {
            onProcess();
        }
    };

    return (
        <div className="card-premium p-6 md:p-8 max-w-2xl mx-auto relative overflow-hidden">
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all z-10"
                aria-label="Close"
            >
                <X className="h-5 w-5" /> 
            </button>

            <div className="relative mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        <Plus className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Add Expenses</h2>
                </div>
                <p className="text-sm text-slate-500"> 
                    Paste bank SMS, digital receipts, or manual entries.
                </p>
            </div>
            
            <form onSubmit={handleAddText} className="mb-8">
                <div className="group relative">
                    <textarea
                        id="transaction-text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="e.g., Spent ₹850 at Starbucks Indiranagar..."
                        className="w-full p-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all resize-none text-sm leading-relaxed placeholder:text-slate-400 min-h-[120px]"
                        disabled={isProcessing}
                    />
                    <div className="absolute right-3 bottom-0.5 transform -translate-y-2.5">
                        <button
                            type="submit"
                            title="Add to queue"
                            className="bg-slate-900 text-white p-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-20 active:scale-95 transition-all"
                            disabled={!currentText.trim() || isProcessing}
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </form>

            <AnimatePresence mode="popLayout">
                {transactionTexts.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="mb-8 p-5 bg-slate-50 rounded-xl border border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-slate-400" />
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue</h3>
                            </div>
                            <span className="text-[11px] font-medium text-slate-400">{transactionTexts.length} pending</span>
                        </div>
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            <AnimatePresence>
                                {transactionTexts.map((text, index) => (
                                    <motion.li 
                                        layout
                                        key={`${text}-${index}`} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg text-xs text-slate-600 border border-slate-100 shadow-sm transition-shadow"
                                    >
                                        <span className="flex-grow mr-4 truncate">"{text}"</span>
                                        <button 
                                            onClick={() => handleRemoveText(index)} 
                                            disabled={isProcessing} 
                                            className="text-slate-300 hover:text-slate-600 transition-colors p-1"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {error && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 mb-8 text-rose-600"
                >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-xs font-medium">{error}</p>
                </motion.div>
            )}

            <div className="space-y-4">
                 <button
                    onClick={handleProcessAll}
                    className="btn-primary w-full py-3.5 h-auto text-sm"
                    disabled={transactionTexts.length === 0 || isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                            Processing Entries...
                        </>
                    ) : (
                        <>
                            <Zap className="h-4 w-4 inline mr-2" />
                            Add {transactionTexts.length} Transaction{transactionTexts.length === 1 ? '' : 's'}
                        </>
                    )}
                </button>

                 <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onScanReceipt}
                        className="btn-secondary py-3 flex items-center justify-center gap-2"
                        disabled={isProcessing}
                    >
                        <Camera className="h-4 w-4" />
                        Scan Receipt
                    </button>
                    <button
                        onClick={onUploadReceipt}
                        className="btn-secondary py-3 flex items-center justify-center gap-2"
                        disabled={isProcessing}
                    >
                        <ImageIcon className="h-4 w-4" />
                        Upload Media
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default MessageProcessor;
