import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function WritingDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', wordCount: 0 });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Writing</h1><p className="text-muted-foreground">Long-form editor</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">New Document</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Document</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ title: '', content: '', wordCount: 0 }); setShowForm(false); }} className="space-y-4">
            <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Chapter 1" /></div>
            <div><Label htmlFor="content">Content</Label><Input id="content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value, wordCount: e.target.value.split(/\s+/).filter(Boolean).length })} placeholder="Start writing..." className="min-h-[200px]" /></div>
            <div className="text-sm text-muted-foreground">Words: {form.wordCount}</div>
            <div className="flex gap-2"><Button type="submit">Create</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Documents</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No documents yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}