'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, MessageSquare, Bug, Lightbulb, Send } from 'lucide-react';
import Link from 'next/link';

const contactSchema = z.object({
  type: z.enum(['general', 'bug', 'feature', 'billing', 'security']),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject too short').max(100),
  message: z.string().min(20, 'Message too short').max(5000),
});

type ContactForm = z.infer<typeof contactSchema>;

const types = [
  { value: 'general', label: 'General Inquiry', icon: MessageSquare, desc: 'Questions, feedback, or general help' },
  { value: 'bug', label: 'Report a Bug', icon: Bug, desc: 'Something is not working correctly' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, desc: 'Suggest a new feature or improvement' },
  { value: 'billing', label: 'Billing & Payments', icon: Mail, desc: 'Subscription, invoices, or payment issues' },
  { value: 'security', label: 'Security Issue', icon: Mail, desc: 'Report a vulnerability (we reward responsible disclosure)' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'general', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Message sent! We\'ll get back to you within 24 hours.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-muted-foreground">We'd love to hear from you. Choose a category below to get started.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>Fill out the form and we'll respond as soon as possible</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label>What's this about?</Label>
                <Select onValueChange={(value) => setValue('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-3">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.desc}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  {...register('subject')}
                  placeholder="Brief summary of your request"
                  error={errors.subject?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  {...register('message')}
                  placeholder="Describe your issue or request in detail..."
                  rows={6}
                  error={errors.message?.message}
                />
              </div>

              <Button type="submit" className="w-full gap-2" loading={loading}>
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {types.map((type) => (
            <Card key={type.value} className="text-center p-6 hover:border-primary/50 transition-colors">
              <type.icon className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-1">{type.label}</h3>
              <p className="text-sm text-muted-foreground mb-4">{type.desc}</p>
              <Button variant="outline" size="sm" onClick={() => {
                const form = document.querySelector('form');
                if (form) {
                  (form.querySelector('[name="type"]') as HTMLSelectElement).value = type.value;
                  form.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}>
                Start {type.label.toLowerCase()}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Prefer email? Contact us directly at <a href="mailto:hello@hey.ai" className="text-primary hover:underline">hello@hey.ai</a></p>
          <p className="mt-2">For urgent security issues, email <a href="mailto:security@hey.ai" className="text-primary hover:underline">security@hey.ai</a></p>
        </div>
      </div>
    </div>
  );
}