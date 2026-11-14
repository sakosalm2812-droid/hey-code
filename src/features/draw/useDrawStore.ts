import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type ToolType = 'pen' | 'pencil' | 'brush' | 'eraser';

export interface Sketch {
  id: string;
  title: string;
  tool: ToolType;
  canvas: string;
  createdAt: string;
}

interface DrawState {
  sketches: Sketch[];
  addSketch: (data: Omit<Sketch, 'id' | 'createdAt'>) => void;
  removeSketch: (id: string) => void;
  updateSketch: (id: string, data: Partial<Sketch>) => void;
  getAll: () => Sketch[];
  getCount: () => number;
}

export const useDrawStore = create<DrawState>()(
  persist(
    (set, get) => ({
      sketches: [],
      addSketch: (data) =>
        set((state) => ({
          sketches: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.sketches,
          ],
        })),
      removeSketch: (id) =>
        set((state) => ({ sketches: state.sketches.filter((s) => s.id !== id) })),
      updateSketch: (id, data) =>
        set((state) => ({
          sketches: state.sketches.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      getAll: () => get().sketches,
      getCount: () => get().sketches.length,
    }),
    { name: 'hey-draw-store' }
  )
);

export default useDrawStore;