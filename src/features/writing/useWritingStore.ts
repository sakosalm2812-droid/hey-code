import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Document {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WritingState {
  documents: Document[];
  addDocument: (data: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, data: Partial<Document>) => void;
  getAll: () => Document[];
  getTotalWords: () => number;
}

export const useWritingStore = create<WritingState>()(
  persist(
    (set, get) => ({
      documents: [],
      addDocument: (data) =>
        set((state) => ({
          documents: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              wordCount: data.content.split(/\s+/).filter(Boolean).length,
              ...data,
            },
            ...state.documents,
          ],
        })),
      removeDocument: (id) =>
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),
      updateDocument: (id, data) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? {
                  ...d,
                  ...data,
                  updatedAt: new Date().toISOString(),
                  wordCount: data.content
                    ? data.content.split(/\s+/).filter(Boolean).length
                    : d.wordCount,
                }
              : d
          ),
        })),
      getAll: () => get().documents,
      getTotalWords: () =>
        get().documents.reduce((sum, d) => sum + d.wordCount, 0),
    }),
    { name: 'hey-writing-store' }
  )
);

export default useWritingStore;