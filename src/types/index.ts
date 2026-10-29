import { UserRole, SubscriptionStatus, PlanType, ChatModel } from '@prisma/client';

export type { UserRole, SubscriptionStatus, PlanType, ChatModel };

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  status: SubscriptionStatus;
  plan: PlanType;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  model: ChatModel;
  systemPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  model: string | null;
  createdAt: Date;
}

export interface Usage {
  id: string;
  userId: string;
  date: Date;
  messagesCount: number;
  tokensUsed: number;
  apiCalls: number;
}

export interface PlanLimits {
  messages: number;
  tokens: number;
  models: ChatModel[];
  apiCalls: number;
}

export interface Plan {
  name: string;
  price: number;
  priceIdMonthly?: string;
  priceIdYearly?: string;
  features: string[];
  limits: PlanLimits;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  metadata: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  type: string;
  processed: boolean;
  payload: Record<string, any>;
  createdAt: Date;
  processedAt: Date | null;
}