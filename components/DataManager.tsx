
import React, { useRef, useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Upload } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { AppData, Expense } from '../types';

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
                    throw new Error('Invalid format');
                }
                
                setDataToImport(importedData);
                setIsConfirmOpen(true);

            } catch (error: any) {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
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
            <div className="w-full max-w-lg mx-auto space-y-6">
                {/* Export Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Download className="h-4 w-4 text-slate-400" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export Backups</h3>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={onExportJson}
                            className="w-full btn-primary h-auto py-3 text-sm flex items-center justify-center gap-2"
                        >
                            <FileJson className="h-4 w-4" />
                            Export Data (.json)
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="w-full btn-secondary h-auto py-3 text-sm flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export Expenses (.csv)
                        </button>
                    </div>
                </div>

                {/* Import Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Upload className="h-4 w-4 text-slate-400" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Import Data</h3>
                    </div>
                    <p className="text-xs text-slate-500 italic mb-4">
                        Warning: Importing will replace all existing sessions and settings.
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
                        className="w-full btn-secondary h-auto py-3 text-sm flex items-center justify-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Restore from JSON
                    </button>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmImport}
                title="Overwrite Local Data?"
                message={
                    <span className="text-slate-600">
                        This will delete all current expenses and settings and replace them with the imported file. <strong>This cannot be undone.</strong>
                    </span>
                }
                confirmText="Yes, Import"
                confirmVariant="danger"
            />
        </>
    );
};

export default DataManager;
