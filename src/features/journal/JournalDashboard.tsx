import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

const moods = ['Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Tired'];

export default function JournalDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', mood: 'Calm' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Journal & Mood</h1><p className="text-muted-foreground">Write your thoughts and track mood</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Week</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Journal Entry</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', content: '', mood: 'Calm' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="How was your day?" /></div>
              <div><Label htmlFor="mood">Mood</Label><Input id="mood" value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} list="moods" placeholder="Select mood" /><datalist id="moods">{moods.map(m => <option key={m} value={m} />)}</datalist></div>
            </div>
            <div><Label htmlFor="content">Content</Label><Input id="content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your thoughts..." className="min-h-[120px]" /></div>
            <div className="flex gap-2"><Button type="submit">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recent Entries</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No entries yet. Start journaling!</div>
      </CardContent></Card>
    </motion.div>
  );
}