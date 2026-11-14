import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface FinanceState {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'date'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  getAll: () => Transaction[];
  getBalance: () => number;
  getIncome: () => number;
  getExpenses: () => number;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (data) =>
        set((state) => ({
          transactions: [
            {
              id: uuid(),
              date: new Date().toISOString(),
              ...data,
            },
            ...state.transactions,
          ],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      getAll: () => get().transactions,
      getBalance: () =>
        get().transactions.reduce(
          (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
          0
        ),
      getIncome: () =>
        get().transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
      getExpenses: () =>
        get().transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
    }),
    { name: 'hey-finance-store' }
  )
);

export default useFinanceStore;