import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  Code,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';

export const metadata: Metadata = {
  title: 'About HEY',
  description:
    'HEY is your AI assistant like Jarvis — one calm, focused conversation surface for frontier AI models, your memories, your files, your voice, and your team. Learn who we are and how we think about privacy.',
  alternates: { canonical: `${baseUrl}/about` },
  openGraph: {
    title: 'About HEY — Your AI Assistant Like Jarvis',
    description:
      'HEY brings GPT-4o, Claude 3, and more into one honest, private conversation surface. The story, the product, and how we think about privacy.',
    url: `${baseUrl}/about`,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HEY — Your AI Assistant Like Jarvis',
    description:
      'HEY brings GPT-4o, Claude 3, and more into one honest, private conversation surface.',
    images: ['/og-image.png'],
  },
};

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Talk to the best models',
    body: 'Chat with GPT-4o, Claude 3 Opus, Sonnet, and Haiku — and more as they arrive. You choose the model, or let HEY route and fail over automatically so the conversation keeps flowing.',
  },
  {
    icon: Brain,
    title: 'A memory that respects you',
    body: 'HEY can remember the facts, preferences, projects, and relationships you choose to save, then bring them up when they matter. Every memory is yours to review and delete in the Memories board.',
  },
  {
    icon: FileText,
    title: 'Bring your information',
    body: 'Upload documents and images into projects, and HEY indexes their content so your files become searchable and referenceable right inside a conversation.',
  },
  {
    icon: Mic,
    title: "Talk, don't type",
    body: 'Dictate naturally with voice input — your recording is transcribed into a message — and HEY can speak replies aloud using your device\u2019s speech engine.',
  },
  {
    icon: Bot,
    title: 'Agents that get things done',
    body: 'Configure custom agents with their own instructions, tools, and permissions to research, summarize, and execute. The built-in terminal adds hands-free controls with on-device hand gestures.',
  },
  {
    icon: Users,
    title: 'Work together',
    body: 'Share team conversations with roles and invitations, and power everyone in the workspace with the same model set, shared projects, and one source of truth.',
  },
  {
    icon: ImageIcon,
    title: 'Create and extend',
    body: 'Generate images, briefings, planners, journals, and goal tracking from a single surface — then extend HEY further with the developer API and API keys.',
  },
  {
    icon: Search,
    title: 'Research, with receipts',
    body: 'Run live web research and get a sourced, cited summary with trust-scored links — not a wall of anonymous text.',
  },
];

const pillars = [
  {
    icon: Shield,
    title: 'Calm by design',
    body: 'One surface instead of ten tabs. Restrained, focused, premium — an assistant that gets out of your way.',
  },
  {
    icon: Sparkles,
    title: 'Privacy by default',
    body: 'No advertising business, no data sold, marketing off until you opt in, and on-device processing where it counts.',
  },
  {
    icon: Zap,
    title: 'Choice across models',
    body: 'We never lock you to one vendor. HEY is the surface; you keep the freedom to pick the model that fits the moment.',
  },
];

const privacyCommitments = [
  'We do not sell your personal information, and HEY runs no ad networks.',
  'Your content is not used to train our models.',
  'Hand-gesture detection and voice playback run on your device.',
  'Marketing email and data-sharing are off until you turn them on.',
  'You can review and delete saved memories at any time.',
  'You can request a copy of your data, or its deletion, at any time.',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main" className="pt-32 lg:pt-40">
        <section className="relative overflow-hidden" aria-labelledby="about-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_65%)] from-primary/10 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                About HEY
              </div>
              <h1
                id="about-heading"
                className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance"
              >
                Your AI Assistant{' '}
                <span className="gradient-text">Like Jarvis</span>
              </h1>
              <p className="mb-10 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto text-balance">
                HEY brings frontier models, your memories, your files, your voice, and your team
                into one calm, focused conversation surface — so the best assistant feels less like
                another tab and more like a teammate.
              </p>
              <p
                className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
                aria-label="HEY brand line"
              >
                No limits to the sky.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="xl" variant="gradient">
                  <Link href="/signup">
                    Start Free — No Credit Card
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="/dashboard/chats/new">
                    Open Your Conversations
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="story-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="story-heading" className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Our story
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                HEY grew out of a simple frustration: powerful AI was scattered across tabs, apps,
                and providers — none of it remembering you. We built HEY as the single surface where
                the best available models, your knowledge, and your team can meet, without the noise.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {pillars.map((value) => (
                <Card key={value.title} className="text-center p-8">
                  <value.icon className="h-10 w-10 mx-auto text-primary mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-muted/30 border-y border-border" aria-labelledby="capabilities-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="capabilities-heading" className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                What HEY does
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                A few of the things you can do with HEY today. More is on the way.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {capabilities.map((feature) => (
                <Card key={feature.title} className="p-8 transition-colors hover:border-primary/40">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 shrink-0" aria-hidden="true">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="privacy-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 id="privacy-heading" className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  How we think about privacy
                </h2>
                <p className="text-lg text-muted-foreground text-balance mb-8">
                  Privacy is a product decision, not a policy footnote. Here is what HEY is built
                  around today — and the full details live in our{' '}
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <Button asChild variant="outline">
                  <Link href="/privacy">
                    Read the Privacy Policy
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <ul className="space-y-4" role="list">
                {privacyCommitments.map((commitment) => (
                  <li
                    key={commitment}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{commitment}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="pb-20 lg:pb-28" aria-labelledby="team-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="team-heading" className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                The team
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                HEY is built by a small, focused team of engineers, designers, and AI researchers
                who believe the next interface worth building is the one that gets out of your way.
                We would love to hear from you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="gradient">
                <Link href="/contact">
                  <Code className="mr-2 h-4 w-4" aria-hidden="true" />
                  Get in touch
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/status">
                  <Terminal className="mr-2 h-4 w-4" aria-hidden="true" />
                  Check service status
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary/85 to-primary/60 p-8 md:p-16 lg:p-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary-foreground/10 to-transparent" />
              <div className="relative z-10 max-w-3xl mx-auto">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/90 mb-4">
                  No limits to the sky.
                </p>
                <h2
                  id="cta-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 text-balance"
                >
                  Start with a hello.
                </h2>
                <p className="text-lg text-primary-foreground/85 mb-10 max-w-xl mx-auto text-balance">
                  Create your free account and begin the conversation. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    asChild
                    size="xl"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto"
                  >
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="xl"
                    variant="outline"
                    className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
                  >
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-primary-foreground/70">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-primary-foreground">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline hover:text-primary-foreground">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}