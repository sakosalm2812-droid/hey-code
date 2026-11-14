import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/AuthContext';

export default function WaterDashboard() {
  const { user } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Water Intake</h1><p className="text-muted-foreground">Track your daily hydration</p></div>
      </div>

      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-1">
            {Array.from({ length: goal }, (_, i) => (
              <div
                key={i}
                onClick={() => setGlasses(i + 1)}
                className={`w-12 h-16 rounded-lg border-2 transition-all cursor-pointer ${
                  i < glasses ? 'bg-blue-500 border-blue-500' : 'border-muted bg-muted/30'
                }`}
              />
            ))}
          </div>
          <div className="text-center">
            <span className="text-4xl font-bold">{glasses}</span> / {goal} glasses
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setGlasses(Math.max(0, glasses - 1))} variant="outline">-</Button>
            <Button onClick={() => setGlasses(Math.min(goal, glasses + 1))}>+</Button>
            <Button variant="outline" onClick={() => setGlasses(0)}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Weekly Avg</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Best Day</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Current Streak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 days</div></CardContent></Card>
      </div>
    </motion.div>
  );
}