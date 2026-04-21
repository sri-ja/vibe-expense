import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
    Check, 
    Trash2, 
    Fingerprint, 
    Calendar,
    IndianRupee,
    Store,
    Quote,
    ScanLine,
    AlertTriangle
} from 'lucide-react';
import { Transaction, AiConfirmationItem } from '../types';

interface AiConfirmationCardProps {
  item: AiConfirmationItem;
  onConfirm: (id: string, data: Omit<Transaction, 'id'>) => void;
  onDiscard: (id: string) => void;
}

const AiConfirmationCard: React.FC<AiConfirmationCardProps> = ({ item, onConfirm, onDiscard }) => {
  const [merchant, setMerchant] = useState(item.parsedData.merchant);
  const [amount, setAmount] = useState(String(item.parsedData.amount || ''));
  const [date, setDate] = useState(item.parsedData.date || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setMerchant(item.parsedData.merchant || '');
    setAmount(String(item.parsedData.amount || ''));
    setDate(item.parsedData.date || new Date().toISOString().split('T')[0]);
    setError('');
  }, [item.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid merchant and amount.');
        return;
    }
    if (!date) {
        setError('Please select a date.');
        return;
    }
    setError('');
    onConfirm(item.id, { merchant: merchant.trim(), amount: parsedAmount, date });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-grow w-full space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <ScanLine className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Content</p>
            </div>
            
            {item.originalText && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 p-6 rounded-2xl text-slate-600 border border-slate-100 italic"
                >
                    <p>"{item.originalText}"</p>
                </motion.div>
            )}

            {item.imageDataUrl && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl overflow-hidden border border-slate-200 h-80 bg-slate-900 group relative"
                >
                    <img src={item.imageDataUrl} alt="Receipt" className="h-full w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                </motion.div>
            )}
        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <Fingerprint className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Verify Extraction</h3>
                </div>
                
                <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-1.5">
                        <label htmlFor={`ai-merchant-${item.id}`} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Merchant</label>
                        <input type="text" id={`ai-merchant-${item.id}`} value={merchant} onChange={e => setMerchant(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-100 outline-none transition-all" placeholder="e.g. Starbucks" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor={`ai-amount-${item.id}`} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Amount</label>
                            <input type="text" inputMode="decimal" id={`ai-amount-${item.id}`} value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-100 outline-none transition-all tabular-nums" placeholder="0.00" required />
                        </div>
                         <div className="space-y-1.5">
                            <label htmlFor={`ai-date-${item.id}`} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Date</label>
                            <input type="date" id={`ai-date-${item.id}`} value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-100 outline-none transition-all" required />
                        </div>
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <p className="text-[11px] font-medium text-red-600">{error}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-4 gap-3">
                    <button type="button" onClick={() => onDiscard(item.id)} className="col-span-1 flex items-center justify-center p-3 rounded-xl text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all">
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button type="submit" className="col-span-3 btn-primary h-auto py-3 text-sm flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        Save Transaction
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AiConfirmationCard;
