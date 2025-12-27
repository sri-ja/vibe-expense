
import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';

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
            setTransactionTexts(prev => [...prev, trimmedText]);
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
        <div className="w-full max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80 relative">
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
            >
                <XIcon className="h-6 w-6" /> 
            </button>
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-slate-800">Add Transactions</h2>
                <p className="mt-2 text-slate-600">
                    Add your transaction SMS or email notifications one by one. Our AI will process them all at once.
                </p>
            </div>
            
            <form onSubmit={handleAddText} className="mt-8">
                <label htmlFor="transaction-text" className="block text-sm font-medium text-slate-700">New Transaction Message</label>
                <div className="mt-1 flex gap-2">
                    <textarea
                        id="transaction-text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="e.g., You spent ₹500 at Starbucks. Paste your multi-line messages here."
                        className="flex-grow p-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                        rows={3}
                        disabled={isProcessing}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        disabled={!currentText.trim() || isProcessing}
                    >
                        Add
                    </button>
                </div>
            </form>

            {transactionTexts.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-slate-700">Pending Transactions</h3>
                    <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-lg p-2 bg-slate-50">
                        {transactionTexts.map((text, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-white rounded-md text-sm text-slate-800 shadow-sm">
                                <span className="flex-grow mr-2 truncate">{text}</span>
                                <button 
                                    onClick={() => handleRemoveText(index)} 
                                    disabled={isProcessing} 
                                    className="text-slate-400 hover:text-red-600 disabled:text-slate-300"
                                    aria-label={`Remove transaction: ${text}`}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

            <div className="mt-8 border-t pt-6 space-y-4">
                 <button
                    onClick={handleProcessAll}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    disabled={transactionTexts.length === 0 || isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <SpinnerIcon className="h-5 w-5 text-white" />
                            Processing...
                        </>
                    ) : (
                        `Process ${transactionTexts.length} Transaction${transactionTexts.length === 1 ? '' : 's'}`
                    )}
                </button>
                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="flex-shrink mx-4 text-slate-500 text-sm">Or</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={onScanReceipt}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                    >
                        <CameraIcon className="h-5 w-5" />
                        Scan a Receipt
                    </button>
                    <button
                        onClick={onUploadReceipt}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                    >
                        <UploadIcon className="h-5 w-5" />
                        Upload an Image
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default MessageProcessor;
