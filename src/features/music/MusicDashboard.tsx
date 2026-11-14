import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function MusicDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', tracks: 0, genre: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Music</h1><p className="text-muted-foreground">Playlist manager</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Playlist</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Playlist</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ name: '', tracks: 0, genre: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Playlist" /></div>
              <div><Label htmlFor="tracks">Track Count</Label><Input id="tracks" type="number" min="0" value={form.tracks} onChange={e => setForm({ ...form, tracks: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="genre">Genre</Label><Input id="genre" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} placeholder="electronic, rock, jazz" /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Playlists</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No playlists yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}