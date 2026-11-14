import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Project {
  id: string;
  name: string;
  progress: number;
  status: 'active' | 'completed' | 'on hold';
  description?: string;
  createdAt: string;
}

interface ProjectsState {
  projects: Project[];
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'progress'>) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  updateProgress: (id: string, progress: number) => void;
  getAll: () => Project[];
  getCompletedCount: () => number;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (data) =>
        set((state) => ({
          projects: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              progress: 0,
              status: 'active',
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
      updateProgress: (id, progress) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, progress: Math.min(100, Math.max(0, progress)) } : p
          ),
        })),
      getAll: () => get().projects,
      getCompletedCount: () =>
        get().projects.filter((p) => p.progress >= 100).length,
    }),
    { name: 'hey-projects-store' }
  )
);

export default useProjectsStore;