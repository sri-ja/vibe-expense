
import { Transaction } from '../types';

const mockData: Transaction[] = [
  { id: 'txn_1', merchant: 'Starbucks', amount: 7.50, date: '2024-07-28' },
  { id: 'txn_2', merchant: 'Netflix Subscription', amount: 15.49, date: '2024-07-28' },
  { id: 'txn_3', merchant: 'Amazon.com', amount: 124.99, date: '2024-07-27' },
  { id: 'txn_4', merchant: 'Vanguard Investments', amount: 500.00, date: '2024-07-27' },
  { id: 'txn_5', merchant: 'Shell Gas Station', amount: 45.30, date: '2024-07-26' },
  { id: 'txn_6', merchant: 'Whole Foods Market', amount: 88.12, date: '2024-07-26' },
  { id: 'txn_7', merchant: 'AMC Theaters', amount: 32.00, date: '2024-07-25' },
  { id: 'txn_8', merchant: 'PG&E Utility Bill', amount: 112.75, date: '2024-07-25' },
  { id: 'txn_9', merchant: 'CVS Pharmacy', amount: 21.45, date: '2024-07-24' },
];

export const fetchMockTransactions = (): Promise<Transaction[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([...mockData]);
    }, 1000);
  });
};
