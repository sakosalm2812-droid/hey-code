import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'HEY';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';

export async function getPolicyVersion(): Promise<number> {
  const row = await prisma.systemConfig.findUnique({ where: { key: 'policy_version' } });
  const value = row?.value as { version?: number } | null;
  return typeof value?.version === 'number' ? value.version : 1;
}

/**
 * Bumps the policy version, drops an in-app notification for every verified
 * user, and emails each user a copy of the change. Used when a material
 * update to the Privacy Policy or Terms is published.
 */
export async function notifyPolicyChange(input: {
  title: string;
  summary: string;
  url: string;
}): Promise<{ version: number; recipients: number; emailed: number }> {
  const current = await getPolicyVersion();
  const next = current + 1;
  await prisma.systemConfig.upsert({
    where: { key: 'policy_version' },
    update: { value: { version: next } },
    create: { key: 'policy_version', value: { version: next } },
  });

  const users = await prisma.user.findMany({
    where: { emailVerified: { not: null } },
    select: { id: true, email: true },
  });

  if (users.length > 0) {
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: 'POLICY_UPDATE',
        title: input.title,
        message: input.summary.slice(0, 500),
        link: input.url,
      })),
    });
  }

  const resolvedUrl = new URL(input.url, APP_URL).toString();
  const [{ render }, { PolicyUpdateEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(
    PolicyUpdateEmail({ title: input.title, summary: input.summary, url: resolvedUrl, appName: APP_NAME })
  );

  let emailed = 0;
  for (const user of users) {
    try {
      await sendEmail(user.email, `Policy update: ${input.title}`, html);
      emailed += 1;
    } catch (error) {
      console.error(`Failed to email policy update to ${user.email}:`, error);
    }
  }

  return { version: next, recipients: users.length, emailed };
}