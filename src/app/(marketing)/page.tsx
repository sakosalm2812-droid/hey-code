import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Your AI Assistant Like Jarvis',
  description: 'HEY is your personal AI assistant powered by GPT-4o, Claude 3, and more. Chat, create, and get things done with the most advanced AI models.',
  openGraph: {
    title: 'HEY - Your AI Assistant Like Jarvis',
    description: 'HEY is your personal AI assistant powered by GPT-4o, Claude 3, and more.',
    images: ['/og-image.png'],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}