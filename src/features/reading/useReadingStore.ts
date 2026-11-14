import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Book {
  id: string;
  title: string;
  author: string;
  progress: number;
  status: string;
}

interface ReadingState {
  books: Book[];
  addBook: (data: Omit<Book, 'id'>) => void;
  removeBook: (id: string) => void;
  updateBook: (id: string, data: Partial<Book>) => void;
  getAll: () => Book[];
  getFinishedCount: () => number;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      books: [],
      addBook: (data) =>
        set((state) => ({ books: [...state.books, { id: uuid(), ...data }] })),
      removeBook: (id) =>
        set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
      updateBook: (id, data) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),
      getAll: () => get().books,
      getFinishedCount: () =>
        get().books.filter((b) => b.progress >= 100 || b.status === 'finished').length,
    }),
    { name: 'hey-reading-store' }
  )
);

export default useReadingStore;