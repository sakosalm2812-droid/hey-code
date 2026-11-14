import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'income', category: '', amount: 0, description: '' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Finance</h1><p className="text-muted-foreground">Track income and expenses</p></div>
        <Button onClick={() => setShowForm(true)} size="lg">Add Transaction</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Income</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">$0.00</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">$0.00</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">$0.00</div></CardContent></Card>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Transaction</CardTitle></CardHeader><CardContent>
          <form onSubmit={e => { e.preventDefault(); setForm({ type: 'income', category: '', amount: 0, description: '' }); setShowForm(false); }} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div><Label htmlFor="type">Type</Label><Input id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} list="types" placeholder="income/expense" /><datalist id="types"><option>income</option><option>expense</option></datalist></div>
              <div><Label htmlFor="category">Category</Label><Input id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="salary, food, rent" /></div>
              <div><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label htmlFor="description">Description</Label><Input id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details" /></div>
            </div>
            <div className="flex gap-2"><Button type="submit">Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Transactions</CardTitle></CardHeader><CardContent>
        <div className="text-center py-8 text-muted-foreground">No transactions yet.</div>
      </CardContent></Card>
    </motion.div>
  );
}