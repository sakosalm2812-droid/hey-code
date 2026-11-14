import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface MoodCard {
  id: string;
  title: string;
  imageUrl: string;
  note: string;
  createdAt: string;
}

interface MoodBoardState {
  cards: MoodCard[];
  addCard: (data: Omit<MoodCard, 'id' | 'createdAt'>) => void;
  removeCard: (id: string) => void;
  updateCard: (id: string, data: Partial<MoodCard>) => void;
  getAll: () => MoodCard[];
  getCount: () => number;
}

export const useMoodBoardStore = create<MoodBoardState>()(
  persist(
    (set, get) => ({
      cards: [],
      addCard: (data) =>
        set((state) => ({
          cards: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.cards,
          ],
        })),
      removeCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
      updateCard: (id, data) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      getAll: () => get().cards,
      getCount: () => get().cards.length,
    }),
    { name: 'hey-moodboard-store' }
  )
);

export default useMoodBoardStore;