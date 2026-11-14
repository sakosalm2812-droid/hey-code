import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function PasswordsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site: '', username: '', password: '', category: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Passwords</h1><p className="text-muted-foreground">Encrypted credential vault (local only)</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Entry</Button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg">
        ⚠️ This vault stores data locally only. No cloud sync.
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Credential</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ site: '', username: '', password: '', category: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="site">Site / App</Label><Input id="site" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} placeholder="github.com" /></div>
              <div><Label htmlFor="category">Category</Label><Input id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="work, personal, banking" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="username">Username / Email</Label><Input id="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="user@example.com" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Saved Credentials</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No credentials stored.</div>
      </CardContent></Card>
    </motion.div>
  );
}