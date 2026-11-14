import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function VoiceMemosDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 0, tags: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Voice Memos</h1><p className="text-muted-foreground">Audio recorder list</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Record</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Voice Memo</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', duration: 0, tags: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Meeting Notes" /></div>
              <div><Label htmlFor="duration">Duration (sec)</Label><Input id="duration" type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label htmlFor="tags">Tags (comma)</Label><Input id="tags" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="work, ideas, personal" /></div>
            <div className="flex gap-2"><Button type="submit">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recordings</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No recordings yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}