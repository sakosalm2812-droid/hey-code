import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface WaterLog {
  id: string;
  glasses: number;
  date: string;
}

interface WaterState {
  logs: WaterLog[];
  addLog: (data: Omit<WaterLog, 'id' | 'date'>) => void;
  removeLog: (id: string) => void;
  updateLog: (id: string, data: Partial<WaterLog>) => void;
  getAll: () => WaterLog[];
  getTotalGlasses: (date: string) => number;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (data) =>
        set((state) => ({
          logs: [
            ...state.logs,
            { id: uuid(), date: new Date().toISOString(), ...data },
          ],
        })),
      removeLog: (id) =>
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      updateLog: (id, data) =>
        set((state) => ({
          logs: state.logs.map((l) => (l.id === id ? { ...l, ...data } : l)),
        })),
      getAll: () => get().logs,
      getTotalGlasses: (date) =>
        get().logs
          .filter((l) => l.date.startsWith(date))
          .reduce((sum, l) => sum + l.glasses, 0),
    }),
    { name: 'hey-water-store' }
  )
);

export default useWaterStore;