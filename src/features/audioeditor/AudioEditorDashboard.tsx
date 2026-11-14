import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function AudioEditorDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 0, format: 'mp3' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Audio Editor</h1><p className="text-muted-foreground">Trim and fade controls</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Project</Button>
      </div>

      <Card className="aspect-video bg-muted/30 rounded-lg">
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          Waveform preview placeholder
        </CardContent>
      </Card>

      {showForm && (
        <Card><CardHeader><CardTitle>New Audio Project</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', duration: 0, format: 'mp3' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Podcast Episode" /></div>
              <div><Label htmlFor="duration">Duration (sec)</Label><Input id="duration" type="number" min="0" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="format">Format</Label><Input id="format" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} list="formats" placeholder="mp3/wav/flac" /><datalist id="formats"><option>mp3</option><option>wav</option><option>flac</option></datalist></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Projects</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No audio projects.</div>
      </CardContent></Card>
    </motion.div>
  );
}