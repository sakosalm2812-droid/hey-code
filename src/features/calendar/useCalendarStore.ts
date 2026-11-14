import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  description?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  getAll: () => CalendarEvent[];
  getEventsByDate: (date: string) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      addEvent: (data) =>
        set((state) => ({
          events: [
            { id: uuid(), ...data },
            ...state.events,
          ],
        })),
      removeEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      updateEvent: (id, data) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),
      getAll: () => get().events,
      getEventsByDate: (date) =>
        get().events.filter((e) => e.date === date),
    }),
    { name: 'hey-calendar-store' }
  )
);

export default useCalendarStore;