import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function InboxDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from: '', subject: '', body: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Inbox</h1><p className="text-muted-foreground">Messages and communications</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Compose</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Compose Message</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ from: '', subject: '', body: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="from">From</Label><Input id="from" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} placeholder="sender@example.com" /></div>
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject line" /></div>
            </div>
            <div><Label htmlFor="body">Body</Label><Input id="body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Message body..." className="min-h-[120px]" /></div>
            <div className="flex gap-2"><Button type="submit">Send</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Messages</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">Inbox empty.</div>
      </CardContent></Card>
    </motion.div>
  );
}