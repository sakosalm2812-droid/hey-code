import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function GoalsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target: 0, current: 0, unit: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Goals</h1><p className="text-muted-foreground">Track your objectives</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Goal</Button>
      </div>

      <Card><CardHeader><CardTitle>Your Goals</CardTitle></CardHeader><CardContent>
        <div className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">No goals yet.</div>
        </div>
      </CardContent></Card>

      {showForm && (
        <Card className="fixed inset-0 z-50 m-auto max-w-md mt-20"><CardHeader><CardTitle>New Goal</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', target: 0, current: 0, unit: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Goal</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Read 12 books" /></div>
              <div><Label htmlFor="unit">Unit</Label><Input id="unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="books, km, hours" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="target">Target</Label><Input id="target" type="number" min="1" value={form.target} onChange={e => setForm({ ...form, target: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="current">Current</Label><Input id="current" type="number" min="0" value={form.current} onChange={e => setForm({ ...form, current: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
    </motion.div>
  );
}