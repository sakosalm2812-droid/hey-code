'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    content: "HEY has completely replaced my workflow. I use it for coding, writing, research, and even planning my week. The multi-model switching is a game-changer.",
    author: "Sarah Chen",
    role: "Senior Engineer at Vercel",
    avatar: "SC",
  },
  {
    content: "The voice input is incredible. I dictate entire blog posts while walking my dog, and HEY structures them perfectly. It's like having a personal assistant.",
    author: "Marcus Johnson",
    role: "Content Creator & Founder",
    avatar: "MJ",
  },
  {
    content: "We rolled out HEY to our 50-person team. The admin dashboard, usage analytics, and SSO made it painless. Our productivity metrics are up 34%.",
    author: "Elena Rodriguez",
    role: "VP Engineering at Stripe",
    avatar: "ER",
  },
  {
    content: "File analysis saves me hours every week. I upload PDFs of research papers and HEY extracts key findings, creates summaries, and answers follow-up questions.",
    author: "Dr. James Park",
    role: "AI Research Scientist",
    avatar: "JP",
  },
  {
    content: "The PWA works flawlessly offline on my phone. I can continue conversations on the subway, and everything syncs when I'm back online. Brilliant engineering.",
    author: "Lisa Thompson",
    role: "Product Manager at Notion",
    avatar: "LT",
  },
  {
    content: "API access lets us embed HEY in our internal tools. Custom models and system prompts mean we get consistent, brand-aligned responses every time.",
    author: "David Kim",
    role: "CTO at Linear",
    avatar: "DK",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-muted/30" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Trusted by{' '}
            <span className="gradient-text">teams everywhere</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what developers, creators, and teams are saying about HEY.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.author} className="animate-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4" aria-label="5 star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-4" aria-hidden="true" />
                <p className="text-lg leading-relaxed mb-6">{testimonial.content}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}