import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

interface NutritionState {
  meals: Meal[];
  addMeal: (data: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  updateMeal: (id: string, data: Partial<Meal>) => void;
  getAll: () => Meal[];
  getTotalCalories: () => number;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      meals: [],
      addMeal: (data) =>
        set((state) => ({ meals: [...state.meals, { id: uuid(), ...data }] })),
      removeMeal: (id) =>
        set((state) => ({ meals: state.meals.filter((m) => m.id !== id) })),
      updateMeal: (id, data) =>
        set((state) => ({
          meals: state.meals.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),
      getAll: () => get().meals,
      getTotalCalories: () =>
        get().meals.reduce((sum, m) => sum + m.calories, 0),
    }),
    { name: 'hey-nutrition-store' }
  )
);

export default useNutritionStore;