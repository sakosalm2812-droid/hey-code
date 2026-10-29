import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, WifiOff, Server, Database, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'HEY System Status - Real-time uptime and incident history',
  openGraph: {
    title: 'HEY System Status',
    description: 'HEY System Status - Real-time uptime and incident history',
    images: ['/og-image.png'],
    url: 'https://hey.ai/status',
  },
};

const components = [
  { name: 'API', status: 'operational', icon: Server, description: 'Core chat and completion APIs' },
  { name: 'Database', status: 'operational', icon: Database, description: 'PostgreSQL database' },
  { name: 'AI Providers', status: 'operational', icon: Cpu, description: 'OpenAI, Anthropic connections' },
  { name: 'Authentication', status: 'operational', icon: CheckCircle, description: 'NextAuth.js sessions' },
  { name: 'Payments', status: 'operational', icon: CheckCircle, description: 'Stripe integration' },
  { name: 'Email', status: 'operational', icon: CheckCircle, description: 'Transactional emails' },
  { name: 'CDN', status: 'operational', icon: WifiOff, description: 'Static assets and PWA' },
  { name: 'Real-time', status: 'degraded', icon: Clock, description: 'Streaming responses' },
];

const incidents = [
  { date: '2026-09-10', title: 'Elevated API latency', status: 'resolved', duration: '45 min', details: 'OpenAI API experienced elevated latency affecting response times.' },
  { date: '2026-09-03', title: 'Database maintenance', status: 'resolved', duration: '30 min', details: 'Scheduled maintenance for index optimization.' },
  { date: '2026-08-28', title: 'Authentication issues', status: 'resolved', duration: '15 min', details: 'NextAuth session cookie issue affecting some users.' },
  { date: '2026-08-15', title: 'Payment webhook delays', status: 'resolved', duration: '2 hours', details: 'Stripe webhook processing delays due to rate limiting.' },
];

export default function StatusPage() {
  const operationalCount = components.filter(c => c.status === 'operational').length;
  const overallStatus = operationalCount === components.length ? 'operational' : 'degraded';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold tracking-tight">System Status</h1>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${overallStatus === 'operational' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
              }`
            }>
              {overallStatus === 'operational' ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
          </div>
          <p className="text-muted-foreground">Real-time status of HEY services and infrastructure</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {components.map((component) => (
                <div 
                  key={component.name} 
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`
                    p-2 rounded-lg
                    ${component.status === 'operational' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}
                  `}>
                    <component.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{component.name}</p>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${component.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  `}>
                    {component.status === 'operational' ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border">
                  <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                    <span className={`
                      p-2 rounded-lg
                      ${incident.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                    `}>
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium text-sm">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">{incident.date} · {incident.duration}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground">{incident.details}</p>
                  </div>
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/contact">
            <Button variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Report an Issue
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Subscribe to status updates via <a href="/contact" className="text-primary hover:underline">contact form</a> or follow <a href="https://twitter.com/hey_status" className="text-primary hover:underline" target="_blank" rel="noopener">@hey_status</a>
          </p>
        </div>
      </div>
    </div>
  );
}