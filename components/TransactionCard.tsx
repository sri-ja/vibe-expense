import React from 'react';
import { Transaction, ExpenseCategory } from '../types';
import CategorySelector from './CategorySelector';

interface TransactionCardProps {
  transaction: Transaction;
  onIgnore: () => void;
  onCategorize: (category: ExpenseCategory) => void;
  categories: string[];
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onIgnore,
  onCategorize,
  categories
}) => {
  return (
    <div className="bg-white rounded-lg p-5 transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-slate-800">{transaction.merchant}</p>
          <p className="text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <p className="text-2xl font-semibold text-slate-900">
          ₹{transaction.amount.toFixed(2)}
        </p>
      </div>

      <div className="mt-6">
        <CategorySelector
          onSelectCategory={onCategorize}
          categories={categories}
        />
        <div className="text-center mt-4">
            <button
                onClick={onIgnore}
                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            >
                Ignore
            </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;