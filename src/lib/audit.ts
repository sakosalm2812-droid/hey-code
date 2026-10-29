import { prisma } from '@/lib/prisma';

export async function auditLog(
  userId: string,
  action: string,
  resource: string,
  metadata: Record<string, any> = {},
  request?: Request
) {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (request) {
    ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    userAgent = request.headers.get('user-agent') || undefined;
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}

export async function getAuditLogs(userId: string, limit = 50, offset = 0) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}