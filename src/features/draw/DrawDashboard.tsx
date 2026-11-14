import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function DrawDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', tool: 'pen', canvas: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Draw</h1><p className="text-muted-foreground">Canvas sketch pad</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Sketch</Button>
      </div>

      <Card className="aspect-video bg-muted/30 rounded-lg">
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          Canvas placeholder — draw your sketch here
        </CardContent>
      </Card>

      {showForm && (
        <Card><CardHeader><CardTitle>New Sketch</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', tool: 'pen', canvas: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sketch 1" /></div>
              <div><Label htmlFor="tool">Tool</Label><Input id="tool" value={form.tool} onChange={e => setForm({ ...form, tool: e.target.value })} list="tools" placeholder="pen/pencil/brush/eraser" /><datalist id="tools"><option>pen</option><option>pencil</option><option>brush</option><option>eraser</option></datalist></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Sketches</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No sketches yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}