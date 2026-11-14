import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Photo {
  id: string;
  title: string;
  url: string;
  tags: string[];
  createdAt: string;
}

interface PhotographyState {
  photos: Photo[];
  addPhoto: (data: Omit<Photo, 'id' | 'createdAt'>) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, data: Partial<Photo>) => void;
  getAll: () => Photo[];
  getByTag: (tag: string) => Photo[];
}

export const usePhotographyStore = create<PhotographyState>()(
  persist(
    (set, get) => ({
      photos: [],
      addPhoto: (data) =>
        set((state) => ({
          photos: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.photos,
          ],
        })),
      removePhoto: (id) =>
        set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),
      updatePhoto: (id, data) =>
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      getAll: () => get().photos,
      getByTag: (tag) => get().photos.filter((p) => p.tags.includes(tag)),
    }),
    { name: 'hey-photography-store' }
  )
);

export default usePhotographyStore;