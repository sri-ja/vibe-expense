import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateProps {
    onAddTransactions: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddTransactions }) => (
    <div className="card-premium text-center p-10 sm:p-20 flex flex-col items-center">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-6">
            <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">No expenses yet</h2>
        <p className="mt-2 text-slate-500 max-w-sm">
            Add bank SMS, digital receipts, or manual entries to start tracking your spending.
        </p>
        <div className="mt-8">
            <button
                onClick={onAddTransactions}
                className="btn-primary"
            >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Transaction
            </button>
        </div>
    </div>
);

export default EmptyState;