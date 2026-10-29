'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles, Lock, Database, BadgeDollarSign } from 'lucide-react';

export function Hero() {
  const launchDate = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE || '2026-10-01T00:00:00Z');
  const now = new Date();
  const isLaunched = now >= launchDate;

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" aria-labelledby="hero-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary/10 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {isLaunched ? 'Now Live' : 'Launching Soon'}
          </div>
          
          <h1 id="hero-heading" className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-slide-up">
            Your AI Assistant{' '}
            <span className="gradient-text">Like Jarvis</span>
          </h1>
          
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
            Chat with GPT-4o, Claude 3 Opus, and more. Get answers, write code, analyze data, and create content — all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link href="/signup">
              <Button size="xl" className="gradient w-full sm:w-auto">
                Start Free - No Credit Card
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              Private by design
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4" />
              Export or delete your data anytime
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeDollarSign className="h-4 w-4" />
              Free to start
            </span>
          </div>
        </div>

        <div className="mt-16 relative animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="aspect-video max-w-5xl mx-auto rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
                  <Button size="xl" variant="ghost" className="h-16 w-16 rounded-full">
                    <span className="text-3xl">▶</span>
                  </Button>
                </div>
                <p className="text-muted-foreground">Click to watch the launch video</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
