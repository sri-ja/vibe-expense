import React from 'react';

interface EmptyStateProps {
    onAddTransactions: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddTransactions }) => (
    <div className="text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200/80">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="mt-6 text-2xl font-semibold text-slate-800">Welcome to Your Expense Tracker</h2>
        <p className="mt-2 text-slate-600">
            Get started by adding your first set of transaction messages.
        </p>
        <div className="mt-8">
            <button
                onClick={onAddTransactions}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Transactions
            </button>
        </div>
    </div>
);

export default EmptyState;