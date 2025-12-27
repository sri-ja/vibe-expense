import React, { useState, useEffect } from 'react';
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
  
  // This effect ensures the form fields are reset with new data
  // when the item being confirmed changes (e.g., after confirming one and moving to the next).
  useEffect(() => {
    setMerchant(item.parsedData.merchant || '');
    setAmount(String(item.parsedData.amount || ''));
    setDate(item.parsedData.date || new Date().toISOString().split('T')[0]);
    setError(''); // Also reset any previous errors
  }, [item.id]);

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
    onConfirm(item.id, { merchant: merchant.trim(), amount: parsedAmount, date });
  };

  return (
    <div className="bg-white rounded-lg transition-all duration-300 ease-in-out p-5">
        <p className="text-sm text-slate-500 mb-2">
            AI parsed the following from your {item.imageDataUrl ? 'receipt' : 'message'}:
        </p>

        {item.originalText && (
            <blockquote className="bg-slate-50 p-3 rounded-md text-slate-700 border-l-4 border-slate-200 mb-6">
                {item.originalText}
            </blockquote>
        )}

        {item.imageDataUrl && (
            <div className="mb-6 rounded-md overflow-hidden border border-slate-200 h-48 flex items-center justify-center bg-slate-100">
                <img src={item.imageDataUrl} alt="Scanned receipt" className="max-h-full max-w-full object-contain" />
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-md font-semibold text-slate-700">Confirm &amp; Edit Suggestion</h3>
            <div>
                <label htmlFor={`ai-merchant-${item.id}`} className="block text-sm font-medium text-slate-600">Merchant</label>
                <input type="text" id={`ai-merchant-${item.id}`} value={merchant} onChange={e => setMerchant(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Starbucks" required />
            </div>
             <div>
                <label htmlFor={`ai-amount-${item.id}`} className="block text-sm font-medium text-slate-600">Amount (₹)</label>
                <input type="text" inputMode="decimal" id={`ai-amount-${item.id}`} value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., 7.50" required />
            </div>
             <div>
                <label htmlFor={`ai-date-${item.id}`} className="block text-sm font-medium text-slate-600">Date</label>
                <input type="date" id={`ai-date-${item.id}`} value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => onDiscard(item.id)} className="px-4 py-2 rounded-md font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Discard
                </button>
                <button type="submit" className="px-4 py-2 rounded-md font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                    Confirm Transaction
                </button>
            </div>
        </form>
    </div>
  );
};

export default AiConfirmationCard;