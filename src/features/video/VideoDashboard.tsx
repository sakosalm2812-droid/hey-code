import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function VideoDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 0, status: 'editing' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Video</h1><p className="text-muted-foreground">Video project manager</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Project</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Video Project</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', duration: 0, status: 'editing' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summer Vlog" /></div>
              <div><Label htmlFor="duration">Duration (sec)</Label><Input id="duration" type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="status">Status</Label><Input id="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} list="statuses" placeholder="editing/rendered/published" /><datalist id="statuses"><option>editing</option><option>rendered</option><option>published</option></datalist></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Projects</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No video projects.</div>
      </CardContent></Card>
    </motion.div>
  );
}