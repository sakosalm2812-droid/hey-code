import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Scene {
  id: string;
  title: string;
  scene: string;
  description: string;
  order: number;
  createdAt: string;
}

interface StoryboardState {
  scenes: Scene[];
  addScene: (data: Omit<Scene, 'id' | 'createdAt'>) => void;
  removeScene: (id: string) => void;
  updateScene: (id: string, data: Partial<Scene>) => void;
  reorderScene: (id: string, newOrder: number) => void;
  getAll: () => Scene[];
  getSortedScenes: () => Scene[];
}

export const useStoryboardStore = create<StoryboardState>()(
  persist(
    (set, get) => ({
      scenes: [],
      addScene: (data) =>
        set((state) => ({
          scenes: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              order: state.scenes.length + 1,
              ...data,
            },
            ...state.scenes,
          ],
        })),
      removeScene: (id) =>
        set((state) => ({ scenes: state.scenes.filter((s) => s.id !== id) })),
      updateScene: (id, data) =>
        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      reorderScene: (id, newOrder) =>
        set((state) => ({
          scenes: state.scenes.map((s) =>
            s.id === id ? { ...s, order: newOrder } : s
          ),
        })),
      getAll: () => get().scenes,
      getSortedScenes: () =>
        [...get().scenes].sort((a, b) => a.order - b.order),
    }),
    { name: 'hey-storyboard-store' }
  )
);

export default useStoryboardStore;