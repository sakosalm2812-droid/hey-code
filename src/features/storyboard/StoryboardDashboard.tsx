import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function StoryboardDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', scene: '', description: '', order: 0 });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Storyboard</h1><p className="text-muted-foreground">Scene-by-scene planner</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Scene</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Scene</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', scene: '', description: '', order: 0 }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Opening Scene" /></div>
              <div><Label htmlFor="order">Order</Label><Input id="order" type="number" min="1" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div><Label htmlFor="scene">Scene</Label><Input id="scene" value={form.scene} onChange={e => setForm({ ...form, scene: e.target.value })} placeholder="EXT. PARK - DAY" /></div>
            <div><Label htmlFor="description">Description</Label><Input id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What happens in this scene..." className="min-h-[80px]" /></div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Scenes</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No scenes yet. Start your story!</div>
      </CardContent></Card>
    </motion.div>
  );
}