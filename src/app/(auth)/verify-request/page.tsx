'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyRequestContent />
    </Suspense>
  );
}

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (email) {
      resendVerification();
    }
  }, [email]);

  const resendVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
        toast.success('Verification email sent!');
      } else {
        toast.error('Failed to send verification email');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-8">
            <Mail className="h-12 w-12 text-primary" />
            <p className="text-muted-foreground">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={resendVerification} 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Resend Verification Email
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?{' '}
              <Link href="/signup" className="text-primary hover:underline">Sign up again</Link>
              {' '}or{' '}
              <Link href="/contact" className="text-primary hover:underline">contact support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
