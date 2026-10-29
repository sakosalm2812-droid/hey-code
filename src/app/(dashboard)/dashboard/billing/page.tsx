'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Check, 
  Loader2, 
  AlertCircle,
  Download,
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: ['100 messages/month', 'GPT-4o-mini', 'Basic support', 'Chat history'],
    limits: { messages: 100 },
  },
  PRO: {
    name: 'Pro',
    price: 2000,
    features: ['Unlimited messages', 'All models (GPT-4o, Claude 3)', 'Priority support', 'API access', 'Voice input', 'File upload'],
    limits: { messages: -1 },
  },
  TEAM: {
    name: 'Team',
    price: 5000,
    features: ['Everything in Pro', 'Team workspace', 'Admin dashboard', 'SSO/SAML', 'Custom contracts', 'Dedicated support'],
    limits: { messages: -1 },
  },
} as const;

type PlanKey = keyof typeof PLANS;

export default function BillingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>('FREE'); // Would come from session/user data
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSuccess(new URLSearchParams(window.location.search).get('success') === 'true');
  }, []);

  const handleUpgrade = async (plan: 'PRO' | 'TEAM') => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan === 'PRO' ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO : process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and billing details</p>
        </div>

        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Your subscription has been updated successfully!</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-3 rounded-full',
                  currentPlan === 'PRO' ? 'bg-primary/10 text-primary' :
                  currentPlan === 'TEAM' ? 'bg-purple/10 text-purple' :
                  'bg-muted text-muted-foreground'
                )}>
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{PLANS[currentPlan as keyof typeof PLANS].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan === 'FREE' ? 'Free forever' : formatCurrency(PLANS[currentPlan as keyof typeof PLANS].price)}/month
                  </p>
                </div>
              </div>
              {currentPlan !== 'FREE' && (
                <Button variant="outline" onClick={handlePortal} disabled={loading} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                const plan = PLANS[planKey];
                const isCurrent = planKey === currentPlan;
                return (
                  <div
                    key={planKey}
                    className={cn(
                      'relative p-6 rounded-xl border transition-all',
                      isCurrent ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          Current
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-3xl font-bold mt-1">
                        {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                        <span className="text-lg font-normal text-muted-foreground">/month</span>
                      </p>
                    </div>
                    <ul className="space-y-3 mb-6" role="list">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent || loading}
                      onClick={() => !isCurrent && handleUpgrade(planKey as 'PRO' | 'TEAM')}
                    >
                      {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Usage This Month
              <Download className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Messages Used</p>
                <p className="text-3xl font-bold mt-1">24 / 100</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-3xl font-bold mt-1">12,450 / 50,000</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">API Calls</p>
                <p className="text-3xl font-bold mt-1">8 / 100</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '8%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-right p-4 font-medium">Amount</th>
                    <th className="text-right p-4 font-medium">Status</th>
                    <th className="text-right p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">{formatDate(new Date())}</td>
                    <td className="p-4">Pro Plan - Monthly</td>
                    <td className="text-right p-4 font-medium">{formatCurrency(2000)}</td>
                    <td className="text-right p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Paid
                      </span>
                    </td>
                    <td className="text-right p-4">
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
}