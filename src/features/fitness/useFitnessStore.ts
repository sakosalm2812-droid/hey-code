import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Workout {
  id: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  date: string;
}

interface FitnessState {
  workouts: Workout[];
  addWorkout: (data: Omit<Workout, 'id'>) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, data: Partial<Workout>) => void;
  getAll: () => Workout[];
  getTotalVolume: () => number;
}

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      workouts: [],
      addWorkout: (data) =>
        set((state) => ({
          workouts: [...state.workouts, { id: uuid(), ...data }],
        })),
      removeWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),
      updateWorkout: (id, data) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === id ? { ...w, ...data } : w
          ),
        })),
      getAll: () => get().workouts,
      getTotalVolume: () =>
        get().workouts.reduce((sum, w) => sum + w.sets * w.reps * w.weight, 0),
    }),
    {
      name: 'hey-fitness-store',
    }
  )
);

export default useFitnessStore;