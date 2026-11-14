// src/engines/nativeMessaging/types.ts
// Engine 16: Native Messaging — Type definitions with interfaces

export interface NativeMessagingConfig {
  enabled: boolean;
  origin: string;
  platforms: string[];
  hcuBudgetPerHour: number;
  maxMessageSize: number;
  retryAttempts: number;
}

export interface NativeMessagingHealth {
  isRunning: boolean;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  enabled: boolean;
}

export interface NativeMessagingEvent {
  type: 'message_sent' | 'message_received' | 'message_failed';
  success?: boolean;
  message?: any;
  error?: string;
}

export interface NativeMessagingRequest {
  id: string;
  origin: string;
  message: any;
}