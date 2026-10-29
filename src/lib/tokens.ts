import { prisma } from '@/lib/prisma';

export async function createVerificationToken(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: userId, token, expires } });
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000);
  await prisma.passwordReset.create({ data: { userId, token, expires } });
  return token;
}

export async function verifyEmailToken(token: string) {
  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires < new Date()) return null;
  await prisma.user.update({ where: { id: vt.identifier }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { token } });
  return vt.identifier;
}

export async function verifyPasswordResetToken(token: string) {
  const pr = await prisma.passwordReset.findUnique({ where: { token } });
  if (!pr || pr.expires < new Date() || pr.used) return null;
  return pr.userId;
}

export async function consumePasswordResetToken(token: string) {
  await prisma.passwordReset.update({ where: { token }, data: { used: true } });
}