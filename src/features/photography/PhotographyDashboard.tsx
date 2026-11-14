import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function PhotographyDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', tags: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Photography</h1><p className="text-muted-foreground">Photo library grid</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Photo</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Add Photo</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', url: '', tags: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sunset at Beach" /></div>
              <div><Label htmlFor="url">Image URL</Label><Input id="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div><Label htmlFor="tags">Tags (comma)</Label><Input id="tags" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="nature, sunset, travel" /></div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Gallery</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No photos yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}