'use client';

import { VirtualTerminal } from '@/components/terminal';

export default function TerminalPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Terminal</h1>
        <p className="text-muted-foreground mt-1">
          Cross-platform launcher and MediaPipe gesture pipeline wired into the same app state.
        </p>
      </div>
      <VirtualTerminal />
    </div>
  );
}