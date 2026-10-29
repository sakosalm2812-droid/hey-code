import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoRetry } from '@/components/auto-retry';

export const metadata: Metadata = {
  title: 'Offline — HEY',
  description: 'HEY is offline - cached content available, reconnect for full functionality',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground/50" />
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The parts of HEY you opened before are still available from cache, but new requests need a connection.
        Reconnect and everything will resume normally.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <AutoRetry />
      </div>
    </div>
  );
}