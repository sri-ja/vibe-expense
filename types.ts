
export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
}

export type ExpenseCategory = string;

export interface Expense extends Transaction {
  category: ExpenseCategory;
}

export interface CustomParser {
  id: string;
  name: string;
  template: string;
}

export interface UnparseableTransaction {
  id: string;
  text: string;
}

export type LogType = 'api' | 'info' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: LogType;
}

export interface Budgets {
  [category: string]: number | undefined;
  overall?: number;
}

export interface RoadmapItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface AppData {
  categorizedExpenses: Expense[];
  budgets: Budgets;
  categories: string[];
  customParsers: CustomParser[];
  roadmap?: RoadmapItem[];
}

export interface AiConfirmationItem {
  id: string;
  originalText?: string;
  imageDataUrl?: string;
  parsedData: Omit<Transaction, 'id'>;
}

export interface AuthState {
  isAuthenticated: boolean;
  vaultKey: string | null;
}
