'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Brain, 
  Mic, 
  FileText, 
  Globe, 
  Shield, 
  Zap, 
  Download,
  Smartphone,
  Users,
  Code,
  Image,
  Settings
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Multi-Model Chat',
    description: 'Switch between GPT-4o, Claude 3 Opus, Sonnet, Haiku, and GPT-4 Turbo seamlessly in one conversation.',
  },
  {
    icon: Brain,
    title: 'Smart Context',
    description: 'HEY remembers your conversation history and preferences, providing contextual responses that improve over time.',
  },
  {
    icon: Code,
    title: 'Code Assistant',
    description: 'Write, debug, and explain code in any language. Syntax highlighting, file uploads, and GitHub integration.',
  },
  {
    icon: FileText,
    title: 'Document Analysis',
    description: 'Upload PDFs, images, and documents. HEY can summarize, extract data, and answer questions about your files.',
  },
  {
    icon: Mic,
    title: 'Voice Input & Output',
    description: 'Talk to HEY naturally with speech-to-text and text-to-speech. Hands-free productivity on any device.',
  },
  {
    icon: Image,
    title: 'Image Generation',
    description: 'Create stunning visuals with DALL-E 3 and Midjourney integration. Describe, iterate, and download.',
  },
  {
    icon: Globe,
    title: 'Web Search & Browse',
    description: 'Real-time web search and browsing capabilities. Get current information, not just training data.',
  },
  {
    icon: Smartphone,
    title: 'PWA - Install Anywhere',
    description: 'Install HEY as a native app on iOS, Android, Mac, Windows, and Linux. Works offline with sync.',
  },
  {
    icon: Users,
    title: 'Team Workspaces',
    description: 'Shared conversations, admin controls, SSO, and usage analytics for teams of any size.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is encrypted, never used for training, and you can export or delete it anytime.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Streaming responses, edge deployment, and optimized inference for sub-second latency.',
  },
  {
    icon: Settings,
    title: 'Customizable',
    description: 'Custom system prompts, model parameters, temperature, and response length per conversation.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need to{' '}
            <span className="gradient-text">work smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            HEY combines the best AI models with powerful features to help you think, create, and execute faster.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 animate-in" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}