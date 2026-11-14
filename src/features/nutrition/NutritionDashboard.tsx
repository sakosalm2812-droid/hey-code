import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function NutritionDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Nutrition & Diet</h1><p className="text-muted-foreground">Track calories and macros</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Meal</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Calories</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 kcal</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Protein</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 g</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Carbs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 g</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Fat</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 g</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Add Meal</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="name">Meal Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Chicken & Rice" /></div>
              <div><Label htmlFor="calories">Calories</Label><Input id="calories" type="number" min="0" value={form.calories} onChange={e => setForm({ ...form, calories: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="protein">Protein (g)</Label><Input id="protein" type="number" min="0" value={form.protein} onChange={e => setForm({ ...form, protein: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="carbs">Carbs (g)</Label><Input id="carbs" type="number" min="0" value={form.carbs} onChange={e => setForm({ ...form, carbs: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="fat">Fat (g)</Label><Input id="fat" type="number" min="0" value={form.fat} onChange={e => setForm({ ...form, fat: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recent Meals</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No meals logged yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}