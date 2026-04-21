import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
    AlertCircle, 
    Trash2, 
    UserCog, 
    Calendar,
    IndianRupee,
    Store,
    Quote,
    FileQuestion,
    CheckCircle2
} from 'lucide-react';
import { UnparseableTransaction, Transaction } from '../types';

interface UnparseableTransactionCardProps {
  item: UnparseableTransaction;
  onIgnore: (id: string) => void;
  onManualAdd: (data: Omit<Transaction, 'id'>, unparseableId: string) => void;
}

const UnparseableTransactionCard: React.FC<UnparseableTransactionCardProps> = ({ item, onIgnore, onManualAdd }) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid merchant and amount.');
        return;
    }
    setError('');
    onManualAdd({ merchant: merchant.trim(), amount: parsedAmount, date }, item.id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-grow w-full space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <FileQuestion className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unparsed Content</p>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/30 p-6 rounded-2xl text-slate-700 border border-amber-100 italic"
            >
                <p>"{item.text}"</p>
            </motion.div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-[11px] font-medium text-slate-500">
                    Gemini could not automatically extract the details.
                </p>
            </div>
        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                        <UserCog className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Manual Entry</h3>
                </div>

                <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-1.5">
                        <label htmlFor="manual-merchant" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Merchant</label>
                        <input type="text" id="manual-merchant" value={merchant} onChange={e => setMerchant(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-50 outline-none transition-all" placeholder="e.g. Local Store" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="manual-amount" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Amount</label>
                            <input type="text" inputMode="decimal" id="manual-amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-50 outline-none transition-all tabular-nums" placeholder="0.00" required />
                        </div>
                         <div className="space-y-1.5">
                            <label htmlFor="manual-date" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">Date</label>
                            <input type="date" id="manual-date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-50 outline-none transition-all" required />
                        </div>
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <p className="text-[11px] font-medium text-red-600">{error}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-4 gap-3">
                    <button type="button" onClick={() => onIgnore(item.id)} className="col-span-1 flex items-center justify-center p-3 rounded-xl text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all">
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button type="submit" className="col-span-3 btn-primary h-auto py-3 text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Add Manually
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default UnparseableTransactionCard;
