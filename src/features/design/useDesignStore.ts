import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type PaletteType = 'palette' | 'gradient' | 'scheme';

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  type: PaletteType;
  createdAt: string;
}

interface DesignState {
  palettes: ColorPalette[];
  addPalette: (data: Omit<ColorPalette, 'id' | 'createdAt'>) => void;
  removePalette: (id: string) => void;
  updatePalette: (id: string, data: Partial<ColorPalette>) => void;
  getAll: () => ColorPalette[];
  getTotalColors: () => number;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      palettes: [],
      addPalette: (data) =>
        set((state) => ({
          palettes: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.palettes,
          ],
        })),
      removePalette: (id) =>
        set((state) => ({ palettes: state.palettes.filter((p) => p.id !== id) })),
      updatePalette: (id, data) =>
        set((state) => ({
          palettes: state.palettes.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      getAll: () => get().palettes,
      getTotalColors: () =>
        get().palettes.reduce((sum, p) => sum + p.colors.length, 0),
    }),
    { name: 'hey-design-store' }
  )
);

export default useDesignStore;