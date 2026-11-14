import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function HabitsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Habits & Streaks</h1><p className="text-muted-foreground">Build daily routines</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Habit</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Habits</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Streaks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Best Streak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Habit</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '' }); setShowForm(false); }} className="space-y-4">
            <div><Label htmlFor="title">Habit Name</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Drink 8 glasses of water" /></div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Your Habits</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No habits yet. Add your first habit!</div>
      </CardContent></Card>
    </motion.div>
  );
}