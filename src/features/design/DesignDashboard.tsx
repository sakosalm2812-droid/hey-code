import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function DesignDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', colors: '', type: 'palette' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Design</h1><p className="text-muted-foreground">Color palette generator</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Palette</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Color Palette</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ name: '', colors: '', type: 'palette' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ocean Breeze" /></div>
              <div><Label htmlFor="type">Type</Label><Input id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} list="types" placeholder="palette/gradient/scheme" /><datalist id="types"><option>palette</option><option>gradient</option><option>scheme</option></datalist></div>
            </div>
            <div><Label htmlFor="colors">Colors (hex, comma-separated)</Label><Input id="colors" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} placeholder="#0077b6, #00b4d8, #90e0ef, #caf0f8" /></div>
            <div className="flex gap-2"><Button type="submit">Generate</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Palettes</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No palettes yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}