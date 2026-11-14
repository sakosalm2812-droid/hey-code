import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthContext';

export default function FocusDashboard() {
  const { user } = useAuth();
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isWork, setIsWork] = useState(true);
  const [sessions, setSessions] = useState(0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.gentle} className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Focus Timer</h1><p className="text-muted-foreground">Pomodoro sessions for deep work</p></div>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isWork ? 'Focus Time' : 'Break Time'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-6xl font-mono tabular-nums">
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setRunning(!running); if (!running) startTimer(); }} size="lg">
              {running ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={() => resetTimer()}>Reset</Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Sessions completed: {sessions}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Work Duration</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" min="1" max="60" value={workTime} onChange={e => { setWorkTime(parseInt(e.target.value) || 1); if (!running) setTimeLeft((parseInt(e.target.value) || 1) * 60); }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Break Duration</CardTitle></CardHeader>
          <CardContent>
            <Input type="number" min="1" max="30" value={breakTime} onChange={e => setBreakTime(parseInt(e.target.value) || 1)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sessions Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Focus Time</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.floor(sessions * workTime)} min</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Streak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 days</div></CardContent></Card>
      </div>
    </motion.div>
  );

  function startTimer() {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          setIsWork(!isWork);
          if (!isWork) setSessions(s => s + 1);
          setTimeLeft((isWork ? breakTime : workTime) * 60);
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function resetTimer() {
    setRunning(false);
    setIsWork(true);
    setTimeLeft(workTime * 60);
  }
}