import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function ContactsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Contacts</h1><p className="text-muted-foreground">Your address book</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Contact</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Contact</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ name: '', email: '', phone: '', company: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 1234" /></div>
              <div><Label htmlFor="company">Company</Label><Input id="company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc" /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>All Contacts</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No contacts yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}