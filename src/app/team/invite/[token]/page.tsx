'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, UserPlus, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth_required'>('loading');
  const [invitation, setInvitation] = useState<{ teamName: string; role: string; email: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid invitation link');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/team/invitations/accept?token=${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setInvitation(data.invitation);
          setStatus('success');
        } else if (res.status === 401) {
          setInvitation(data.invitation);
          setStatus('auth_required');
        } else {
          setStatus('error');
          setError(data.error || 'Invalid or expired invitation');
        }
      } catch {
        setStatus('error');
        setError('Failed to verify invitation');
      }
    };

    verify();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/team/invitations/accept?token=${token}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setTimeout(() => router.push('/dashboard/team'), 2000);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to accept invitation');
      }
    } catch {
      setStatus('error');
      setError('Failed to accept invitation');
    }
  };

  const handleSignIn = () => {
    signIn('credentials', { callbackUrl: `/team/invite/${token}` });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary inline-flex">
            {status === 'success' ? (
              <CheckCircle className="h-8 w-8" />
            ) : status === 'error' ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : (
              <UserPlus className="h-8 w-8" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'success' ? 'Invitation Accepted!' : status === 'error' ? 'Invalid Invitation' : 'Team Invitation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{invitation.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Role: <span className="font-medium capitalize">{invitation.role.toLowerCase()}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Team: <span className="font-medium">{invitation.teamName}</span></span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-green-600 font-medium">Welcome to the team! Redirecting...</p>
              <Button className="w-full" onClick={() => router.push('/dashboard/team')}>
                Go to Team Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-destructive text-sm">{error || 'This invitation link is invalid or has expired.'}</p>
              <Link href="/contact">
                <Button variant="outline" className="w-full">Contact Support</Button>
              </Link>
            </div>
          )}

          {status === 'auth_required' && (
            <div className="space-y-3">
              <p className="text-muted-foreground">Please sign in to accept this invitation</p>
              <Button className="w-full" onClick={handleSignIn}>
                Sign In to Accept
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
