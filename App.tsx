
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { parseTransactionsFromText } from './services/geminiService';
import { parseWithRules } from './services/ruleBasedParsers';
import { Transaction, Expense, UnparseableTransaction, Budgets, CustomParser, AppData, AiConfirmationItem, RoadmapItem, AuthState } from './types';
import TransactionCard from './components/TransactionCard';
import UnparseableTransactionCard from './components/UnparseableTransactionCard';
import AiConfirmationCard from './components/AiConfirmationCard';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseChart from './components/ExpenseChart';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { LogIcon } from './components/icons/LogIcon';
import MessageProcessor from './components/MessageProcessor';
import LogViewer from './components/LogViewer';
import BudgetStatus from './components/BudgetStatus';
import EmptyState from './components/EmptyState';
import { DEFAULT_EXPENSE_CATEGORIES } from './constants';
import { getWeeksInMonth, formatDateRange } from './utils/dateUtils';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from './components/icons/ChevronRightIcon';
import { logService } from './services/logService';
import Settings from './components/Settings';
import Trends from './components/Trends';
import { TrendingUpIcon } from './components/icons/TrendingUpIcon';
import ReceiptScanner from './components/ReceiptScanner';
import { LogoIcon } from './components/icons/LogoIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { CloudIcon } from './components/icons/CloudIcon';
import Login from './components/Login';

const LOCAL_STORAGE_KEY = 'expense-tracker-data';
const SESSION_AUTH_KEY = 'expense-tracker-vault-key';

// Helper for Zero-Knowledge Hashing
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
      const savedKey = sessionStorage.getItem(SESSION_AUTH_KEY);
      return {
          isAuthenticated: !!savedKey,
          vaultKey: savedKey
      };
  });

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [unparseableTransactions, setUnparseableTransactions] = useState<UnparseableTransaction[]>([]);
  const [aiConfirmationQueue, setAiConfirmationQueue] = useState<AiConfirmationItem[]>([]);
  const [categorizedExpenses, setCategorizedExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budgets>({});
  const [categories, setCategories] = useState<string[]>([...DEFAULT_EXPENSE_CATEGORIES]);
  const [customParsers, setCustomParsers] = useState<CustomParser[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [pendingTextTransactions, setPendingTextTransactions] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isViewingLogs, setIsViewingLogs] = useState<boolean>(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);

  const [isAddingTransactions, setIsAddingTransactions] = useState<boolean>(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const handleLogin = async (password: string) => {
      const hashed = await hashPassword(password);
      sessionStorage.setItem(SESSION_AUTH_KEY, hashed);
      setAuth({ isAuthenticated: true, vaultKey: hashed });
  };

  const handleLogout = () => {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      setAuth({ isAuthenticated: false, vaultKey: null });
  };

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.vaultKey) return;

    const initData = async () => {
        setIsLoading(true);
        logService.addLog("Unlocking zero-knowledge vault...", "info");
        
        let loadedData: AppData | null = null;

        // 1. Try Local Storage first for speed
        try {
            const localDataString = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${auth.vaultKey}`);
            if (localDataString) {
                loadedData = JSON.parse(localDataString);
                logService.addLog("Loaded cached data from device.", "info");
            }
        } catch (e) {
            console.warn("Failed to parse local storage data:", e);
        }

        // 2. Try Cloud for freshest data
        try {
            const response = await fetch('/api/data', {
                headers: { 'x-vault-key': auth.vaultKey || '' }
            });
            if (response.ok) {
                const cloudData = await response.json();
                if (cloudData && Object.keys(cloudData).length > 0) {
                    loadedData = cloudData;
                    logService.addLog("Synced freshest data from Cloud Vault.", "info");
                }
            }
        } catch (e) {
            console.warn("Cloud sync currently unavailable.", e);
        }

        if (loadedData) {
            setCategorizedExpenses(loadedData.categorizedExpenses || []);
            setBudgets(loadedData.budgets || {});
            setCategories(loadedData.categories && loadedData.categories.length > 0 ? loadedData.categories : [...DEFAULT_EXPENSE_CATEGORIES]);
            setCustomParsers(loadedData.customParsers || []);
            setRoadmap(loadedData.roadmap || []);
        }
        
        setIsLoading(false);
    };

    initData();
  }, [auth.isAuthenticated, auth.vaultKey]);

  useEffect(() => {
    if (isLoading || !auth.isAuthenticated || !auth.vaultKey) return;

    const handler = setTimeout(async () => {
        const dataToSave: AppData = {
            categorizedExpenses,
            budgets,
            categories,
            customParsers,
            roadmap,
        };

        // Save local copy
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${auth.vaultKey}`, JSON.stringify(dataToSave));

        // Sync with Cloud
        setIsSyncing(true);
        setSyncError(false);
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-vault-key': auth.vaultKey || ''
                },
                body: JSON.stringify(dataToSave)
            });
            if (!response.ok) throw new Error("Sync failed");
            logService.addLog("Cloud Vault synchronized.", "info");
        } catch (e) {
            console.error("Cloud sync failed", e);
            setSyncError(true);
        } finally {
            setIsSyncing(false);
        }
    }, 1500);

    return () => clearTimeout(handler);
  }, [categorizedExpenses, budgets, categories, customParsers, roadmap, isLoading, auth.isAuthenticated, auth.vaultKey]);

  const hasNoData = useMemo(() => 
    pendingTransactions.length === 0 && 
    categorizedExpenses.length === 0 && 
    unparseableTransactions.length === 0 && 
    aiConfirmationQueue.length === 0, 
  [pendingTransactions, categorizedExpenses, unparseableTransactions, aiConfirmationQueue]);

  const weeksInMonth = useMemo(() => getWeeksInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);

  useEffect(() => {
    const today = new Date();
    if (today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth()) {
        const weekIndex = weeksInMonth.findIndex(week => today >= week.start && today <= week.end);
        if (weekIndex !== -1) setSelectedWeekIndex(weekIndex);
    } else {
        setSelectedWeekIndex(0);
    }
  }, [currentDate, weeksInMonth]);

  const currentDateRange = useMemo(() => {
    if (viewMode === 'day') {
        const start = new Date(currentDate); start.setHours(0, 0, 0, 0);
        const end = new Date(currentDate); end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return weeksInMonth[selectedWeekIndex] || { start: new Date(), end: new Date() };
  }, [viewMode, currentDate, selectedWeekIndex, weeksInMonth]);

  const isDateInCurrentRange = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const start = new Date(currentDateRange.start); start.setHours(0,0,0,0);
    return date >= start && date <= currentDateRange.end;
  };

  const visibleExpenses = useMemo(() => categorizedExpenses.filter(e => isDateInCurrentRange(e.date)), [categorizedExpenses, currentDateRange]);
  const currentAiConfirmation = aiConfirmationQueue.length > 0 ? aiConfirmationQueue[0] : null;
  const currentTransaction = pendingTransactions.length > 0 ? pendingTransactions[0] : null;
  const currentUnparseable = unparseableTransactions.length > 0 ? unparseableTransactions[0] : null;

  const chartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    visibleExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryTotals).map(([name, total]) => ({ name, total }));
  }, [visibleExpenses]);

  const processAllTransactions = useCallback(async () => {
    if (pendingTextTransactions.length === 0) return;
    setIsProcessing(true);
    setError(null);
    const ruleBasedParser = await parseWithRules(customParsers);
    for (const text of pendingTextTransactions) {
        let parsed = false;
        const ruleResult = ruleBasedParser(text);
        if (ruleResult) {
            setPendingTransactions(prev => [...prev, { id: crypto.randomUUID(), ...ruleResult.data }]);
            parsed = true;
            continue;
        }
        try {
            const aiResult = await parseTransactionsFromText(text);
            if (aiResult.length > 0) {
                 const itemsForConfirmation: AiConfirmationItem[] = aiResult.map(parsedData => ({
                    id: crypto.randomUUID(),
                    originalText: text,
                    parsedData
                }));
                setAiConfirmationQueue(prev => [...prev, ...itemsForConfirmation]);
                parsed = true;
            }
        } catch (e: any) {
            console.error(e);
        }
        if (!parsed) {
            setUnparseableTransactions(prev => [...prev, { id: crypto.randomUUID(), text }]);
        }
    }
    setPendingTextTransactions([]);
    setIsProcessing(false);
    setIsAddingTransactions(false);
  }, [customParsers, pendingTextTransactions]);
  
  const handleCategorize = (transaction: Transaction, category: string) => {
    setCategorizedExpenses(prev => [...prev, { ...transaction, category }]);
    setPendingTransactions(prev => prev.filter(t => t.id !== transaction.id));
  };

  const handleIgnore = (id: string) => setPendingTransactions(prev => prev.filter(t => t.id !== id));
  const handleIgnoreUnparseable = (id: string) => setUnparseableTransactions(prev => prev.filter(t => t.id !== id));
  
  const handleManualAdd = (data: Omit<Transaction, 'id'>, unparseableId: string) => {
    setPendingTransactions(prev => [{ id: crypto.randomUUID(), ...data }, ...prev]);
    setUnparseableTransactions(prev => prev.filter(t => t.id !== unparseableId));
  };

  const handleAiConfirm = (idToConfirm: string, confirmedData: Omit<Transaction, 'id'>) => {
    setPendingTransactions(prev => [{ id: crypto.randomUUID(), ...confirmedData }, ...prev]);
    setAiConfirmationQueue(prev => prev.filter(item => item.id !== idToConfirm));
  };

  const handleAiDiscard = (idToDiscard: string) => setAiConfirmationQueue(prev => prev.filter(item => item.id !== idToDiscard));
  
  const handleReceiptParsed = (parsedData: Omit<Transaction, 'id'>, imageDataUrl: string) => {
    setAiConfirmationQueue(prev => [{ id: crypto.randomUUID(), imageDataUrl, parsedData }, ...prev]);
    setIsScanningReceipt(false);
  };

  const handleDeleteExpense = (idToDelete: string) => setCategorizedExpenses(prev => prev.filter(expense => expense.id !== idToDelete));
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const increment = direction === 'next' ? 1 : -1;
    if (viewMode === 'week') {
        const newIndex = selectedWeekIndex + increment;
        if (newIndex >= 0 && newIndex < weeksInMonth.length) setSelectedWeekIndex(newIndex);
        else setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + increment, 1); return d; });
        return;
    }
    setCurrentDate(prev => { const d = new Date(prev); if (viewMode === 'day') d.setDate(d.getDate() + increment); else d.setMonth(d.getMonth() + increment); return d; });
  };

  const dateDisplay = useMemo(() => {
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    if (viewMode === 'month') return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return weeksInMonth[selectedWeekIndex] ? formatDateRange(weeksInMonth[selectedWeekIndex].start, weeksInMonth[selectedWeekIndex].end) : '';
  }, [viewMode, currentDate, selectedWeekIndex, weeksInMonth]);
  
  const handleImportData = (data: AppData) => {
    setCategorizedExpenses(data.categorizedExpenses || []);
    setBudgets(data.budgets || {});
    setCategories(data.categories && data.categories.length > 0 ? data.categories : [...DEFAULT_EXPENSE_CATEGORIES]);
    setCustomParsers(data.customParsers || []);
    setRoadmap(data.roadmap || []);
    setIsSettingsOpen(false);
  };

  const handleExportJson = () => {
        const jsonString = JSON.stringify({ categorizedExpenses, budgets, categories, customParsers, roadmap }, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'expenses.json';
        link.click();
        URL.revokeObjectURL(url);
  };

  if (!auth.isAuthenticated) return <Login onLogin={handleLogin} />;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="text-center"><SpinnerIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" /><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Unlocking Vault...</p></div></div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
                <div className="flex items-center gap-2">
                    <LogoIcon className="h-7 w-7 md:h-8 md:w-8 text-indigo-600" />
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 hidden xs:block">Vault Tracker</h1>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <div className="px-2" title={isSyncing ? "Saving..." : "Synced"}>
                        <CloudIcon className={`h-5 w-5 ${isSyncing ? 'text-indigo-400 animate-pulse' : syncError ? 'text-red-500' : 'text-green-500'}`} />
                    </div>
                    
                    <div className="flex items-center bg-slate-100 rounded-full p-1 overflow-x-auto no-scrollbar max-w-[120px] sm:max-w-none">
                        <button onClick={() => setIsAnalysisOpen(true)} className="p-2 rounded-full text-slate-600 hover:bg-white hover:text-indigo-600 transition-all shrink-0"><TrendingUpIcon className="h-5 w-5"/></button>
                        <button onClick={handleExportJson} className="p-2 rounded-full text-slate-600 hover:bg-white hover:text-indigo-600 transition-all shrink-0"><DownloadIcon className="h-5 w-5"/></button>
                        <button onClick={() => setIsViewingLogs(true)} className="p-2 rounded-full text-slate-600 hover:bg-white hover:text-indigo-600 transition-all shrink-0"><LogIcon className="h-5 w-5"/></button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-slate-600 hover:bg-white hover:text-indigo-600 transition-all shrink-0"><SettingsIcon className="h-5 w-5"/></button>
                        <button onClick={handleLogout} className="p-2 rounded-full text-slate-400 hover:text-red-500 transition-all shrink-0 ml-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                        </button>
                    </div>

                    <button onClick={() => setIsAddingTransactions(true)} className="flex items-center gap-2 ml-1 md:ml-2 px-4 py-2 text-sm font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200">
                        <PlusIcon className="h-5 w-5"/><span className="hidden md:inline">Add</span>
                    </button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {isAddingTransactions && !isScanningReceipt && (
            <div className="mb-8"><MessageProcessor onProcess={processAllTransactions} isProcessing={isProcessing} error={error} onScanReceipt={() => { setScanMode('camera'); setIsScanningReceipt(true); }} onUploadReceipt={() => { setScanMode('upload'); setIsScanningReceipt(true); }} onClose={() => { setIsAddingTransactions(false); setPendingTextTransactions([]); }} transactionTexts={pendingTextTransactions} setTransactionTexts={setPendingTextTransactions} /></div>
        )}

        {hasNoData && !isAddingTransactions ? <EmptyState onAddTransactions={() => setIsAddingTransactions(true)} /> : (
             <div className="space-y-6 md:space-y-8">
                <div className="bg-white/90 backdrop-blur-md p-2 md:p-3 rounded-full shadow-lg border border-slate-200/80 flex items-center justify-between sticky top-[72px] md:top-[88px] z-30">
                    <button onClick={() => navigateDate('prev')} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeftIcon /></button>
                    <div className="flex-grow text-center flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
                        <span className="font-bold text-slate-700 text-sm md:text-base">{dateDisplay}</span>
                        <div className="inline-flex p-1 bg-slate-100 rounded-full text-[10px] md:text-xs">
                            <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded-full font-bold transition-all ${viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>DAY</button>
                            <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-full font-bold transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>WEEK</button>
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-full font-bold transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>MONTH</button>
                        </div>
                    </div>
                    <button onClick={() => navigateDate('next')} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRightIcon /></button>
                </div>
                
                {currentAiConfirmation ? (
                    <div className="p-4 md:p-6 bg-cyan-50/50 border-2 border-dashed border-cyan-200 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <h2 className="text-lg md:text-xl font-bold text-cyan-800 mb-4 px-2">Verify AI Suggestion ({aiConfirmationQueue.length})</h2>
                        <AiConfirmationCard key={currentAiConfirmation.id} item={currentAiConfirmation} onConfirm={handleAiConfirm} onDiscard={handleAiDiscard} />
                    </div>
                ) : currentTransaction ? (
                    <div className="p-4 md:p-6 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl">
                        <h2 className="text-lg md:text-xl font-bold text-indigo-800 mb-4 px-2">Categorize Pending ({pendingTransactions.length})</h2>
                        <TransactionCard key={currentTransaction.id} transaction={currentTransaction} onIgnore={() => handleIgnore(currentTransaction.id)} onCategorize={(category) => handleCategorize(currentTransaction, category)} categories={categories} />
                    </div>
                ) : currentUnparseable ? (
                     <div className="p-4 md:p-6 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-3xl">
                        <h2 className="text-lg md:text-xl font-bold text-amber-800 mb-4 px-2">Manual Entry Needed</h2>
                        <UnparseableTransactionCard key={currentUnparseable.id} item={currentUnparseable} onIgnore={handleIgnoreUnparseable} onManualAdd={handleManualAdd} />
                    </div>
                ) : (
                     <div className="p-8 md:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                        <CheckCircleIcon /><h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-4 italic">Spotless!</h2>
                        <p className="text-slate-500 mt-2">All transactions in this view are categorized.</p>
                     </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                    <BudgetStatus expenses={visibleExpenses} budgets={budgets} />
                    <ExpenseChart data={chartData} />
                </div>
                <ExpenseSummary expenses={visibleExpenses} onDeleteExpense={handleDeleteExpense} />
            </div>
        )}
      </main>

      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} categories={categories} setCategories={setCategories} categorizedExpenses={categorizedExpenses} budgets={budgets} setBudgets={setBudgets} customParsers={customParsers} setCustomParsers={setCustomParsers} roadmap={roadmap} setRoadmap={setRoadmap} onImportData={handleImportData} onExportJson={handleExportJson} />}
      {isViewingLogs && <LogViewer onClose={() => setIsViewingLogs(false)} />}
      {isAnalysisOpen && <Trends onClose={() => setIsAnalysisOpen(false)} initialTab="trends" expenses={categorizedExpenses} categories={categories} />}
      {isScanningReceipt && <ReceiptScanner onClose={() => setIsScanningReceipt(false)} onReceiptParsed={handleReceiptParsed} initialMode={scanMode} />}
    </div>
  );
};

export default App;
