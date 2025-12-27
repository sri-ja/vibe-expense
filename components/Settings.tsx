
import React, { useState } from 'react';
import { Expense, Budgets, CustomParser, AppData, RoadmapItem } from '../types';
import CategoryManager from './CategoryManager';
import ParserManager from './ParserManager';
import BudgetManager from './BudgetManager';
import DataManager from './DataManager';
import RoadmapManager from './RoadmapManager';
import { SettingsIcon } from './icons/SettingsIcon';
import { CodeIcon } from './icons/CodeIcon';
import { WalletIcon } from './icons/WalletIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { XIcon } from './icons/XIcon';

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
  onImportData: (data: AppData) => void;
  onExportJson: () => void;
}

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center flex-col md:flex-row gap-1 md:gap-2 px-3 md:px-5 py-3 md:py-4 text-[10px] md:text-sm font-bold border-b-2 transition-all shrink-0 ${
            isActive 
            ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' 
            : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
        }`}
        role="tab"
        aria-selected={isActive}
    >
        <span className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</span>
        <span className="uppercase tracking-widest">{label}</span>
    </button>
);

const Settings: React.FC<SettingsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center md:p-4" onClick={props.onClose}>
            <div className="bg-slate-50 md:rounded-3xl shadow-2xl w-full h-full md:max-w-5xl md:h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-200 bg-white">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900">Preferences</h2>
                        <p className="text-xs text-slate-500">Configure your tracker experience.</p>
                    </div>
                    <button onClick={props.onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex px-2 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar scroll-smooth" role="tablist">
                    <TabButton icon={<SettingsIcon className="h-4 w-4 md:h-5 md:w-5"/>} label="Labels" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                    <TabButton icon={<CodeIcon className="h-4 w-4 md:h-5 md:w-5"/>} label="Rules" isActive={activeTab === 'parsers'} onClick={() => setActiveTab('parsers')} />
                    <TabButton icon={<WalletIcon className="h-4 w-4 md:h-5 md:w-5"/>} label="Limits" isActive={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} />
                    <TabButton icon={<ClipboardListIcon className="h-4 w-4 md:h-5 md:w-5"/>} label="Plans" isActive={activeTab === 'roadmap'} onClick={() => setActiveTab('roadmap')} />
                    <TabButton icon={<DatabaseIcon className="h-4 w-4 md:h-5 md:w-5"/>} label="Storage" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                </div>

                <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50/30">
                    <div className="max-w-4xl mx-auto">
                        {activeTab === 'categories' && (
                            <CategoryManager categories={props.categories} setCategories={props.setCategories} categorizedExpenses={props.categorizedExpenses} />
                        )}
                        {activeTab === 'parsers' && <ParserManager customParsers={props.customParsers} setCustomParsers={props.setCustomParsers} />}
                        {activeTab === 'budgets' && (
                            <BudgetManager categories={props.categories} budgets={props.budgets} setBudgets={props.setBudgets} onClose={props.onClose} />
                        )}
                        {activeTab === 'roadmap' && <RoadmapManager roadmap={props.roadmap} setRoadmap={props.setRoadmap} />}
                        {activeTab === 'data' && (
                            <DataManager appData={{ categorizedExpenses: props.categorizedExpenses, budgets: props.budgets, categories: props.categories, customParsers: props.customParsers, roadmap: props.roadmap }} onImport={props.onImportData} onExportJson={props.onExportJson} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
