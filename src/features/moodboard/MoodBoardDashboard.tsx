import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function MoodBoardDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', imageUrl: '', note: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Mood Board</h1><p className="text-muted-foreground">Image + note collage</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Card</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Mood Card</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', imageUrl: '', note: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Inspiration" /></div>
              <div><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div><Label htmlFor="note">Note</Label><Input id="note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Why this inspires me..." className="min-h-[80px]" /></div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Board</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">Empty board. Add your first card!</div>
      </CardContent></Card>
    </motion.div>
  );
}