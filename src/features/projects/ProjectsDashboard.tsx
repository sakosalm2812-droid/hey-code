import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function ProjectsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', progress: 0, status: 'active' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Projects</h1><p className="text-muted-foreground">Manage your projects</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Project</Button>
      </div>

      <Card><CardHeader><CardTitle>All Projects</CardTitle></CardHeader><CardContent>
        <div className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">No projects yet.</div>
        </div>
      </CardContent></Card>

      {showForm && (
        <Card className="fixed inset-0 z-50 m-auto max-w-md mt-20"><CardHeader><CardTitle>New Project</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ name: '', progress: 0, status: 'active' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Project name" /></div>
              <div><Label htmlFor="status">Status</Label><Input id="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} list="statuses" placeholder="active/completed" /><datalist id="statuses"><option>active</option><option>completed</option><option>on hold</option></datalist></div>
            </div>
            <div><Label htmlFor="progress">Progress %</Label><Input id="progress" type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} /></div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}
    </motion.div>
  );
}