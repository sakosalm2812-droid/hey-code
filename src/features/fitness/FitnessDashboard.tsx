import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

const exercisePresets = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull-up', 'Push-up', 'Barbell Row'];

export default function FitnessDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ exercise: '', sets: 3, reps: 10, weight: 45 });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Fitness & Workouts</h1><p className="text-muted-foreground">Track your strength and progress</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Workout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Workouts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Volume</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 lbs</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Exercises</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Add Workout</CardTitle></CardHeader><CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setForm({ exercise: '', sets: 3, reps: 10, weight: 45 }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="exercise">Exercise</Label><Input id="exercise" value={form.exercise} onChange={e => setForm({ ...form, exercise: e.target.value })} list="exercises" placeholder="or type custom" /><datalist id="exercises">{exercisePresets.map(ex => <option key={ex} value={ex} />)}</datalist></div>
              <div><Label htmlFor="sets">Sets</Label><Input id="sets" type="number" min="1" max="20" value={form.sets} onChange={e => setForm({ ...form, sets: parseInt(e.target.value) || 1 })} /></div>
              <div><Label htmlFor="reps">Reps</Label><Input id="reps" type="number" min="1" max="100" value={form.reps} onChange={e => setForm({ ...form, reps: parseInt(e.target.value) || 1 })} /></div>
              <div><Label htmlFor="weight">Weight (lbs)</Label><Input id="weight" type="number" min="1" step="0.5" value={form.weight} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || 1 })} /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recent Workouts</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No workouts yet. Add your first workout!</div>
      </CardContent></Card>
    </motion.div>
  );
}