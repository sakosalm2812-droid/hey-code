'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 lg:py-32" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-8 md:p-16 lg:p-24 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary-foreground/10 to-transparent" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground mb-6">
              <Sparkles className="h-4 w-4" />
              Ready to supercharge your productivity?
            </div>
            
            <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Get more done with an assistant that knows you
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto">
              Start free today. No credit card required. Cancel anytime.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="xl" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                  Contact Sales
                </Button>
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-primary-foreground/60">
              By signing up, you agree to our <a href="/terms" className="underline hover:text-primary-foreground">Terms</a> and <a href="/privacy" className="underline hover:text-primary-foreground">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
