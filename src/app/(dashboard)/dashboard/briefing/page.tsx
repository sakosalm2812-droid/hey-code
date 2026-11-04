'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sunrise, ListChecks, Flame, BookOpenText, AlertCircle } from 'lucide-react';

interface BriefingTask {
id: string;
title: string;
priority: string;
}

interface Briefing {
greeting: string;
bullets: string[];
focus: string[];
timestamp: string;
journalStreak: number;
bestHabitStreak: number;
tasks: { dueToday: BriefingTask[]; overdue: BriefingTask[] };
}

const