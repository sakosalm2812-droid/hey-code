import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  genre: string;
  createdAt: string;
}

interface MusicState {
  playlists: Playlist[];
  addPlaylist: (data: Omit<Playlist, 'id' | 'createdAt'>) => void;
  removePlaylist: (id: string) => void;
  updatePlaylist: (id: string, data: Partial<Playlist>) => void;
  getAll: () => Playlist[];
  getTotalTracks: () => number;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      playlists: [],
      addPlaylist: (data) =>
        set((state) => ({
          playlists: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.playlists,
          ],
        })),
      removePlaylist: (id) =>
        set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) })),
      updatePlaylist: (id, data) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      getAll: () => get().playlists,
      getTotalTracks: () =>
        get().playlists.reduce((sum, p) => sum + p.trackCount, 0),
    }),
    { name: 'hey-music-store' }
  )
);

export default useMusicStore;