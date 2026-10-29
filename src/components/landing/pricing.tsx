'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, X, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for trying out HEY',
    features: [
      { name: '100 messages/month', included: true },
      { name: 'GPT-4o-mini model', included: true },
      { name: 'Basic chat history', included: true },
      { name: 'Community support', included: true },
      { name: 'GPT-4o & Claude 3', included: false },
      { name: 'Voice input/output', included: false },
      { name: 'File upload & analysis', included: false },
      { name: 'API access', included: false },
      { name: 'Team workspaces', included: false },
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: 20,
    period: 'month',
    description: 'For power users and professionals',
    features: [
      { name: 'Unlimited messages', included: true },
      { name: 'All models (GPT-4o, Claude 3)', included: true },
      { name: 'Priority support', included: true },
      { name: 'Voice input/output', included: true },
      { name: 'File upload & analysis', included: true },
      { name: 'API access', included: true },
      { name: 'Custom system prompts', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Team workspaces', included: false },
    ],
    cta: 'Get Pro',
    popular: true,
    yearlyPrice: 192,
  },
  {
    name: 'Team',
    price: 50,
    period: 'month',
    description: 'For teams and organizations',
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Team workspaces', included: true },
      { name: 'Admin dashboard', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'Custom contracts', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Usage analytics', included: true },
      { name: 'Priority feature requests', included: true },
      { name: 'SLA guarantee', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
    yearlyPrice: 480,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent{' '}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={cn(
                  'relative flex flex-col',
                  plan.popular && 'border-primary shadow-lg shadow-primary/10'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="underline cursor-help">
                            Billed yearly - Save 20% (${plan.yearlyPrice}/year)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">
                          <p>Billed annually. Cancel anytime, prorated refund.</p>
                        </TooltipContent>
                      </Tooltip>
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 space-y-3">
                  <ul className="space-y-3" role="list">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        <span className={cn(
                          'flex h-5 w-5 items-center justify-center shrink-0 rounded',
                          feature.included ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
                        )}>
                          {feature.included ? (
                            <Check className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <X className="h-3 w-3" aria-hidden="true" />
                          )}
                        </span>
                        <span className={cn('text-sm', feature.included ? '' : 'text-muted-foreground')}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <a href={plan.name === 'Team' ? '/contact' : '/signup'}>
                      {plan.cta}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TooltipProvider>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial of Pro features. No credit card required.
          <a href="/terms" className="text-primary hover:underline ml-2">Terms of Service</a>
          {' '}·{' '}
          <a href="/privacy" className="text-primary hover:underline ml-2">Privacy Policy</a>
        </p>
      </div>
    </section>
  );
}
