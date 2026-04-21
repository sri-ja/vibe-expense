
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    Settings as SettingsIcon, 
    Code, 
    Wallet, 
    Database, 
    ClipboardList,
    LayoutGrid,
    Binary,
    ShieldCheck
} from 'lucide-react';
import { Expense, Budgets, CustomParser, AppData, RoadmapItem } from '../types';
import CategoryManager from './CategoryManager';
import ParserManager from './ParserManager';
import BudgetManager from './BudgetManager';
import DataManager from './DataManager';
import RoadmapManager from './RoadmapManager';

type SettingsTab = 'categories' | 'parsers' | 'budgets' | 'roadmap' | 'data';

interface SettingsProps {
  onClose: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  categorizedExpenses: Expense[];
  budgets: Budgets;
  setBudgets: React.Dispatch<React.SetStateAction<Budgets>>;
  customParsers: CustomParser[];
  setCustomParsers: React.Dispatch<React.SetStateAction<CustomParser[]>>;
  roadmap: RoadmapItem[];
  setRoadmap: React.Dispatch<React.SetStateAction<RoadmapItem[]>>;
  monthNotes: Record<string, string>;
  onImportData: (data: AppData) => void;
  onExportJson: () => void;
}

const TabButton: React.FC<{ icon: React.ElementType; label: string; isActive: boolean; onClick: () => void; }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-3 text-[11px] font-medium uppercase tracking-wider transition-all relative group ${
            isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        <Icon className={`h-4 w-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
        <span>{label}</span>
        {isActive && (
            <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full"
            />
        )}
    </button>
);

const Settings: React.FC<SettingsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={props.onClose}
        >
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <SettingsIcon className="h-4 w-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Settings</h2>
                    </div>
                    <button 
                        onClick={props.onClose} 
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-4 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar" role="tablist">
                    <TabButton icon={LayoutGrid} label="Categories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                    <TabButton icon={Binary} label="Rules" isActive={activeTab === 'parsers'} onClick={() => setActiveTab('parsers')} />
                    <TabButton icon={Wallet} label="Budgets" isActive={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} />
                    <TabButton icon={ClipboardList} label="Roadmap" isActive={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
                    <TabButton icon={Database} label="Data" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                </div>

                {/* Content Section */}
                <div className="flex-grow p-8 md:p-12 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-5xl mx-auto"
                        >
                            {activeTab === 'categories' && (
                                <CategoryManager categories={props.categories} setCategories={props.setCategories} categorizedExpenses={props.categorizedExpenses} />
                            )}
                            {activeTab === 'parsers' && <ParserManager customParsers={props.customParsers} setCustomParsers={props.setCustomParsers} />}
                            {activeTab === 'budgets' && (
                                <BudgetManager categories={props.categories} budgets={props.budgets} setBudgets={props.setBudgets} onClose={props.onClose} />
                            )}
                            {activeTab === 'roadmap' && <RoadmapManager roadmap={props.roadmap} setRoadmap={props.setRoadmap} />}
                            {activeTab === 'data' && (
                                <DataManager appData={{ categorizedExpenses: props.categorizedExpenses, budgets: props.budgets, categories: props.categories, customParsers: props.customParsers, roadmap: props.roadmap, monthNotes: props.monthNotes }} onImport={props.onImportData} onExportJson={props.onExportJson} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Settings;
