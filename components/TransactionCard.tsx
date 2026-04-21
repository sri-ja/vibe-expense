import React from 'react';
import { motion } from 'motion/react';
import { Transaction, ExpenseCategory } from '../types';
import CategorySelector from './CategorySelector';
import { getCategoryColor } from '../utils/colorUtils';

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
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
      <div className="flex-grow w-full">
        <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg font-semibold text-slate-600">
                {transaction.merchant.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{transaction.merchant}</h3>
                <p className="text-xs text-slate-400">
                    {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
            </div>
        </div>
        
        <div className="px-1">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                <span className="text-lg text-slate-400 mr-0.5">₹</span>
                {transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
        </div>
      </div>

      <div className="w-full md:w-auto md:min-w-[360px]">
        <CategorySelector
          onSelectCategory={onCategorize}
          categories={categories}
        />
        
        <div className="mt-6 flex justify-center">
            <button
                onClick={onIgnore}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
                Not an expense
            </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
