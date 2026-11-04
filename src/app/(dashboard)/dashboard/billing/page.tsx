'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
CreditCard,
Check,
Loader2,
Settings,
Sparkles,
Zap,
Users,
ArrowRight,
Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from