import React, { useState } from 'react';
import { UnparseableTransaction, Transaction } from '../types';

interface UnparseableTransactionCardProps {
  item: UnparseableTransaction;
  onIgnore: (id: string) => void;
  onManualAdd: (data: Omit<Transaction, 'id'>, unparseableId: string) => void;
}

const UnparseableTransactionCard: React.FC<UnparseableTransactionCardProps> = ({ item, onIgnore, onManualAdd }) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid merchant and a positive amount.');
        return;
    }
    if (!date) {
        setError('Please enter a valid date.');
        return;
    }
    setError('');
    onManualAdd({ merchant: merchant.trim(), amount: parsedAmount, date }, item.id);
  };

  return (
    <div className="bg-white rounded-lg transition-all duration-300 ease-in-out">
        <p className="text-sm text-slate-500 mb-2">Could not automatically parse:</p>
        <blockquote className="bg-slate-50 p-3 rounded-md text-slate-700 border-l-4 border-slate-200 mb-6">
            {item.text}
        </blockquote>

        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Enter Details Manually</h3>
            <div>
                <label htmlFor="manual-merchant" className="block text-sm font-medium text-slate-600">Merchant</label>
                <input type="text" id="manual-merchant" value={merchant} onChange={e => setMerchant(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Starbucks" required />
            </div>
             <div>
                <label htmlFor="manual-amount" className="block text-sm font-medium text-slate-600">Amount (₹)</label>
                <input type="text" inputMode="decimal" id="manual-amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., 7.50" required />
            </div>
             <div>
                <label htmlFor="manual-date" className="block text-sm font-medium text-slate-600">Date</label>
                <input type="date" id="manual-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => onIgnore(item.id)} className="px-4 py-2 rounded-md font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Ignore
                </button>
                <button type="submit" className="px-4 py-2 rounded-md font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                    Add Transaction
                </button>
            </div>
        </form>
    </div>
  );
};

export default UnparseableTransactionCard;