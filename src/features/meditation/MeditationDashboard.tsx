import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function MeditationDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ duration: 10, type: 'breathing' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Meditation</h1><p className="text-muted-foreground">Track your meditation sessions</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Session</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Time</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 min</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Streak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 days</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Log Session</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ duration: 10, type: 'breathing' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="duration">Duration (min)</Label><Input id="duration" type="number" min="1" max="120" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} /></div>
              <div><Label htmlFor="type">Type</Label><Input id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} list="types" placeholder="breathing, guided, etc." /><datalist id="types"><option>breathing</option><option>guided</option><option>body scan</option><option>mantra</option></datalist></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Log</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No sessions yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}