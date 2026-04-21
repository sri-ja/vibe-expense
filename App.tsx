
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { parseTransactionsFromText } from './services/geminiService';
import { parseWithRules } from './services/ruleBasedParsers';
import { Transaction, Expense, UnparseableTransaction, Budgets, CustomParser, AppData, AiConfirmationItem, RoadmapItem } from './types';
import TransactionCard from './components/TransactionCard';
import UnparseableTransactionCard from './components/UnparseableTransactionCard';
import AiConfirmationCard from './components/AiConfirmationCard';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseChart from './components/ExpenseChart';
import { 
    CheckCircle2, 
    Settings as SettingsIcon, 
    Plus as PlusIcon, 
    History as LogIcon, 
    ChevronLeft as ChevronLeftIcon, 
    ChevronRight as ChevronRightIcon, 
    TrendingUp as TrendingUpIcon,
    Wallet as LogoIcon,
    Loader2 as SpinnerIcon,
    Download as DownloadIcon,
    LayoutDashboard,
    Calendar,
    Filter
} from 'lucide-react';
import MessageProcessor from './components/MessageProcessor';
import LogViewer from './components/LogViewer';
import BudgetStatus from './components/BudgetStatus';
import EmptyState from './components/EmptyState';
import { DEFAULT_EXPENSE_CATEGORIES } from './constants';
import { getWeeksInMonth, formatDateRange } from './utils/dateUtils';
import { logService } from './services/logService';
import Settings from './components/Settings';
import Trends from './components/Trends';
import ReceiptScanner from './components/ReceiptScanner';

const LOCAL_STORAGE_KEY = 'expense-tracker-data-v2';

const App: React.FC = () => {
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

  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        logService.addLog("Loading data from local storage...", "info");
        
        try {
            const localDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localDataString) {
                const loadedData: AppData = JSON.parse(localDataString);
                setCategorizedExpenses(loadedData.categorizedExpenses || []);
                setBudgets(loadedData.budgets || {});
                setCategories(loadedData.categories && loadedData.categories.length > 0 ? loadedData.categories : [...DEFAULT_EXPENSE_CATEGORIES]);
                setCustomParsers(loadedData.customParsers || []);
                setRoadmap(loadedData.roadmap || []);
                logService.addLog("Data loaded successfully.", "info");
            }
        } catch (e) {
            console.warn("Failed to parse local storage data:", e);
        }
        
        setIsLoading(false);
    };

    initData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const handler = setTimeout(() => {
        const dataToSave: AppData = {
            categorizedExpenses,
            budgets,
            categories,
            customParsers,
            roadmap,
        };

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        logService.addLog("Data auto-saved to device.", "info");
    }, 1500);

    return () => clearTimeout(handler);
  }, [categorizedExpenses, budgets, categories, customParsers, roadmap, isLoading]);

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

  const handleUpdateExpenseCategory = (id: string, category: string) => {
      setCategorizedExpenses(prev => prev.map(expense => 
          expense.id === id ? { ...expense, category } : expense
      ));
      logService.addLog(`Updated category for expense to "${category}".`, "info");
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

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center"><SpinnerIcon className="h-10 w-10 text-slate-400 mx-auto mb-4 animate-spin" /><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Data</p></motion.div></div>;

    return (
        <div className="min-h-screen bg-[#fcfcfd] flex flex-col selection:bg-slate-900 selection:text-white">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                                <LogoIcon className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Spendwise</h1>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => setIsAnalysisOpen(true)} className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all" title="Analysis"><TrendingUpIcon className="h-4 w-4"/></button>
                                <button onClick={handleExportJson} className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all" title="Export"><DownloadIcon className="h-4 w-4"/></button>
                                <button onClick={() => setIsViewingLogs(true)} className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all" title="Logs"><LogIcon className="h-4 w-4"/></button>
                                <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all" title="Settings"><SettingsIcon className="h-4 w-4"/></button>
                            </div>

                            <button onClick={() => setIsAddingTransactions(true)} className="btn-primary h-9 px-4 text-sm">
                                <PlusIcon className="h-4 w-4 inline mr-1"/><span className="hidden xs:inline">Add Expense</span>
                            </button>
                            
                            <button onClick={() => setIsSettingsOpen(true)} className="sm:hidden p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200"><SettingsIcon className="h-4 w-4"/></button>
                        </motion.div>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">
                <AnimatePresence mode="wait">
                    {isAddingTransactions && !isScanningReceipt && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-8 max-w-4xl mx-auto">
                            <MessageProcessor onProcess={processAllTransactions} isProcessing={isProcessing} error={error} onScanReceipt={() => { setScanMode('camera'); setIsScanningReceipt(true); }} onUploadReceipt={() => { setScanMode('upload'); setIsScanningReceipt(true); }} onClose={() => { setIsAddingTransactions(false); setPendingTextTransactions([]); }} transactionTexts={pendingTextTransactions} setTransactionTexts={setPendingTextTransactions} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {hasNoData && !isAddingTransactions ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <EmptyState onAddTransactions={() => setIsAddingTransactions(true)} />
                    </motion.div>
                ) : (
                     <div className="space-y-10 md:space-y-16">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center sticky top-[80px] md:top-[90px] z-30">
                            <div className="bg-white/90 backdrop-blur-md px-2 py-2 rounded-2xl flex items-center gap-1 shadow-xl shadow-slate-200/40 border border-slate-200">
                                <button onClick={() => navigateDate('prev')} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeftIcon className="h-5 w-5" /></button>
                                
                                <div className="flex items-center gap-4 px-4">
                                    <span className="font-bold text-slate-900 text-sm md:text-base min-w-[140px] text-center tracking-tight">{dateDisplay}</span>
                                    <div className="hidden sm:flex p-1 bg-slate-50 rounded-xl text-[10px] font-bold border border-slate-100">
                                        <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>DAY</button>
                                        <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>WEEK</button>
                                        <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>MONTH</button>
                                    </div>
                                </div>

                                <button onClick={() => navigateDate('next')} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"><ChevronRightIcon className="h-5 w-5" /></button>
                            </div>
                        </motion.div>
                        
                        <AnimatePresence mode="popLayout">
                            {currentAiConfirmation && (
                                <motion.div key={currentAiConfirmation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-5xl mx-auto overflow-hidden">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">{aiConfirmationQueue.length}</span>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review Extraction</h2>
                                    </div>
                                    <AiConfirmationCard item={currentAiConfirmation} onConfirm={handleAiConfirm} onDiscard={handleAiDiscard} />
                                </motion.div>
                            )}

                            {currentTransaction && !currentAiConfirmation && (
                                <motion.div key={currentTransaction.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-5xl mx-auto overflow-hidden">
                                     <div className="flex items-center gap-3 mb-8">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">{pendingTransactions.length}</span>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Categorize Expense</h2>
                                    </div>
                                    <TransactionCard transaction={currentTransaction} onIgnore={() => handleIgnore(currentTransaction.id)} onCategorize={(category) => handleCategorize(currentTransaction, category)} categories={categories} />
                                </motion.div>
                            )}

                            {currentUnparseable && !currentTransaction && !currentAiConfirmation && (
                                <motion.div key={currentUnparseable.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-5xl mx-auto overflow-hidden">
                                    <h2 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Manual Input Needed</h2>
                                    <UnparseableTransactionCard item={currentUnparseable} onIgnore={handleIgnoreUnparseable} onManualAdd={handleManualAdd} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!currentAiConfirmation && !currentTransaction && !currentUnparseable && visibleExpenses.length > 0 && (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 px-8 bg-slate-50 border border-slate-200 rounded-3xl group">
                                <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                     <CheckCircle2 className="h-6 w-6 text-slate-900" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">Zero Pending</h2>
                                <p className="text-slate-400 mt-2 text-sm text-center max-w-xs font-medium">Your financial feed is completely organized and up to date.</p>
                             </motion.div>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                <BudgetStatus expenses={visibleExpenses} budgets={budgets} />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                <ExpenseChart data={chartData} />
                            </motion.div>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <ExpenseSummary 
                              expenses={visibleExpenses} 
                              onDeleteExpense={handleDeleteExpense} 
                              onUpdateCategory={handleUpdateExpenseCategory}
                              categories={categories}
                            />
                        </motion.div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} categories={categories} setCategories={setCategories} categorizedExpenses={categorizedExpenses} budgets={budgets} setBudgets={setBudgets} customParsers={customParsers} setCustomParsers={setCustomParsers} roadmap={roadmap} setRoadmap={setRoadmap} onImportData={handleImportData} onExportJson={handleExportJson} />}
                {isViewingLogs && <LogViewer onClose={() => setIsViewingLogs(false)} />}
                {isAnalysisOpen && <Trends onClose={() => setIsAnalysisOpen(false)} initialTab="trends" expenses={categorizedExpenses} categories={categories} />}
                {isScanningReceipt && <ReceiptScanner onClose={() => setIsScanningReceipt(false)} onReceiptParsed={handleReceiptParsed} initialMode={scanMode} />}
            </AnimatePresence>
            
            <footer className="py-12 border-t border-slate-100 mt-auto text-center">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Privacy First • Local Data Storage • India</p>
            </footer>
        </div>
    );
};

export default App;
