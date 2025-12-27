
import React, { useRef, useState } from 'react';
import { AppData, Expense } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import ConfirmationModal from './ConfirmationModal';

interface DataManagerProps {
  appData: AppData;
  onImport: (data: AppData) => void;
  onExportJson: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({ appData, onImport, onExportJson }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { categorizedExpenses } = appData;
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [dataToImport, setDataToImport] = useState<AppData | null>(null);

    const handleExportCsv = () => {
        if (categorizedExpenses.length === 0) {
            alert("No categorized expenses to export.");
            return;
        }

        const headers: (keyof Expense)[] = ['id', 'date', 'merchant', 'amount', 'category'];
        
        const escapeCsvValue = (value: any) => {
            const stringValue = String(value);
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        };
        
        const csvRows = [
            headers.join(','),
            ...categorizedExpenses.map(exp => 
                headers.map(header => escapeCsvValue(exp[header])).join(',')
            )
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'expenses.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('Failed to read file.');
                const importedData = JSON.parse(text);

                if (typeof importedData !== 'object' || importedData === null || Array.isArray(importedData)) {
                    throw new Error('Invalid data file format. The file must contain a JSON object.');
                }
                
                setDataToImport(importedData);
                setIsConfirmOpen(true);

            } catch (error: any) {
                alert(`Error importing data: ${error.message}`);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
             alert('Error reading the file.');
        }
        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        if (dataToImport) {
            onImport(dataToImport);
        }
        handleCloseConfirm();
    };

    const handleCloseConfirm = () => {
        setDataToImport(null);
        setIsConfirmOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className="w-full max-w-lg mx-auto space-y-8">
                {/* Export Section */}
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Export Data</h3>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            Download your data (including roadmap, budgets, and settings) for backup.
                        </p>
                        <button
                            onClick={onExportJson}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Export as JSON (.json)
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                            Export Expenses as CSV (.csv)
                        </button>
                    </div>
                </div>

                {/* Import Section */}
                <div className="bg-white p-6 rounded-lg border">
                     <h3 className="text-lg font-semibold text-slate-700 mb-4">Import Data</h3>
                     <p className="text-sm text-slate-600 mb-3">
                        Import data from a previously exported JSON file. This will replace all existing data, including roadmap notes.
                    </p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept=".json"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300"
                    >
                        <UploadIcon className="h-5 w-5" />
                        Import from JSON
                    </button>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmImport}
                title="Confirm Data Import"
                message={
                    <>
                        Are you sure you want to import this file?
                        <br />
                        <strong>This action will overwrite all your current data.</strong>
                        <br />
                        This action cannot be undone.
                    </>
                }
                confirmText="Import"
                confirmVariant="primary"
            />
        </>
    );
};

export default DataManager;
