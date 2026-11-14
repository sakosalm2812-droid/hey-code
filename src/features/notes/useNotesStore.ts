import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  getAll: () => Note[];
  getByTag: (tag: string) => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (data) =>
        set((state) => ({
          notes: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data,
            },
            ...state.notes,
          ],
        })),
      removeNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      updateNote: (id, data) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
          ),
        })),
      getAll: () => get().notes,
      getByTag: (tag) => get().notes.filter((n) => n.tags.includes(tag)),
    }),
    { name: 'hey-notes-store' }
  )
);

export default useNotesStore;