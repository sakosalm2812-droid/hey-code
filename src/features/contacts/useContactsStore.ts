import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

interface ContactsState {
  contacts: Contact[];
  addContact: (data: Omit<Contact, 'id' | 'createdAt'>) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  getAll: () => Contact[];
  getCount: () => number;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      addContact: (data) =>
        set((state) => ({
          contacts: [
            {
              id: uuid(),
              createdAt: new Date().toISOString(),
              ...data,
            },
            ...state.contacts,
          ],
        })),
      removeContact: (id) =>
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),
      updateContact: (id, data) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      getAll: () => get().contacts,
      getCount: () => get().contacts.length,
    }),
    { name: 'hey-contacts-store' }
  )
);

export default useContactsStore;