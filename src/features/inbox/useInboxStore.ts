import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
  date: string;
}

interface InboxState {
  messages: Message[];
  addMessage: (data: Omit<Message, 'id' | 'read' | 'date'>) => void;
  removeMessage: (id: string) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  markAsRead: (id: string) => void;
  getAll: () => Message[];
  getUnreadCount: () => number;
}

export const useInboxStore = create<InboxState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (data) =>
        set((state) => ({
          messages: [
            {
              id: uuid(),
              read: false,
              date: new Date().toISOString(),
              ...data,
            },
            ...state.messages,
          ],
        })),
      removeMessage: (id) =>
        set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
      updateMessage: (id, data) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),
      markAsRead: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, read: true } : m
          ),
        })),
      getAll: () => get().messages,
      getUnreadCount: () =>
        get().messages.filter((m) => !m.read).length,
    }),
    { name: 'hey-inbox-store' }
  )
);

export default useInboxStore;