'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
Card,
CardContent,
CardDescription,
CardFooter,
CardHeader,
CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
ArrowLeft,
CheckCircle2,
Mail,
ShieldCheck,
Send,
Loader2,
} from 'lucide-react';

const