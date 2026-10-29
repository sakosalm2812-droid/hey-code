'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function AutoRetry() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const check = () => setOnline(navigator.onLine);
    check();
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    if (online) {
      const t = setTimeout(() => window.location.reload(), 600);
      return () => clearTimeout(t);
    }
  }, [online]);

  return (
    <Button variant="outline" onClick={() => window.location.reload()}>
      Retry now
    </Button>
  );
}