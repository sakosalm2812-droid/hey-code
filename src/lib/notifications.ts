import { prisma } from '@/lib/prisma';
import { pushWebPush } from '@/lib/push';

export type NotificationType = 'GENERAL' | 'TEAM' | 'BILLING' | 'SYSTEM' | 'MEMORY';

export async function createNotification({
  userId,
  type = 'GENERAL',
  title,
  message,
  link,
  metadata,
  dispatchPush = true,
}: {
  userId: string;
  type?: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, any>;
  dispatchPush?: boolean;
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link, metadata },
  });

  if (dispatchPush) {
    // Fire-and-forget: never block core actions on push delivery.
    pushWebPush(userId, { title, body: message ?? title, url: link }).catch(() => {});
  }

  return notification;
}

export async function getNotifications(userId: string, opts: { limit?: number; unreadOnly?: boolean } = {}) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(opts.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 50,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}