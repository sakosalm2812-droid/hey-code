import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function SleepDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bedtime: '', wakeTime: '', quality: 80 });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Sleep & Recovery</h1><p className="text-muted-foreground">Log sleep and track quality</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Duration</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0h 0m</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Quality</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Add Sleep Entry</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ bedtime: '', wakeTime: '', quality: 80 }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label htmlFor="bedtime">Bedtime</Label><Input id="bedtime" type="time" value={form.bedtime} onChange={e => setForm({ ...form, bedtime: e.target.value })} /></div>
              <div><Label htmlFor="wakeTime">Wake Time</Label><Input id="wakeTime" type="time" value={form.wakeTime} onChange={e => setForm({ ...form, wakeTime: e.target.value })} /></div>
              <div><Label htmlFor="quality">Quality (1-100)</Label><Input id="quality" type="number" min="1" max="100" value={form.quality} onChange={e => setForm({ ...form, quality: parseInt(e.target.value) || 80 })} /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Sleep Log</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No sleep entries yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}