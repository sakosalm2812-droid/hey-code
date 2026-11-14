import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function StepsDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ steps: 0 });
  const [goal, setGoal] = useState(10000);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Steps Tracker</h1><p className="text-muted-foreground">Count your daily steps</p></div>
      </div>

      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Today's Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-5xl font-bold">{form.steps.toLocaleString()}</span>
            <div className="text-muted-foreground">of {goal.toLocaleString()} goal</div>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${Math.min(100, (form.steps / goal) * 100)}%` }} />
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setForm({ ...form, steps: Math.max(0, form.steps - 1000) })}>-1k</Button>
            <Button variant="outline" onClick={() => setForm({ ...form, steps: form.steps + 1000 })}>+1k</Button>
            <Button variant="outline" onClick={() => setForm({ steps: 0 })}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Weekly Avg</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Best Day</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Streak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 days</div></CardContent></Card>
      </div>
    </motion.div>
  );
}