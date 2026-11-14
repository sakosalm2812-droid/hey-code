import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export type VideoStatus = 'editing' | 'rendered' | 'published';

export interface VideoProject {
  id: string;
  title: string;
  duration: number;
  status: VideoStatus;
  createdAt: string;
}

interface VideoState {
  projects: VideoProject[];
  addProject: (data: Omit<VideoProject, 'id' | 'createdAt'>) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, data: Partial<VideoProject>) => void;
  getAll: () => VideoProject[];
  getByStatus: (status: VideoStatus) => VideoProject[];
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (data) =>
        set((state) => ({
          projects: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              status: 'editing',
              ...data,
            },
            ...state.projects,
          ],
        })),
      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      getAll: () => get().projects,
      getByStatus: (status) =>
        get().projects.filter((p) => p.status === status),
    }),
    { name: 'hey-video-store' }
  )
);

export default useVideoStore;