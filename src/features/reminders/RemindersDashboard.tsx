import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function RemindersDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', datetime: '', repeat: 'none' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Reminders</h1><p className="text-muted-foreground">Time-based reminders</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Reminder</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Reminder</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', datetime: '', repeat: 'none' }); setShowForm(false); }} className="space-y-4">
            <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Take a break" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="datetime">Date & Time</Label><Input id="datetime" type="datetime-local" value={form.datetime} onChange={e => setForm({ ...form, datetime: e.target.value })} /></div>
              <div><Label htmlFor="repeat">Repeat</Label><Input id="repeat" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })} list="repeats" placeholder="none/daily/weekly" /><datalist id="repeats"><option>none</option><option>daily</option><option>weekly</option><option>monthly</option></datalist></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Upcoming</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No reminders set.</div>
      </CardContent></Card>
    </motion.div>
  );
}