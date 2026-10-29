import { createVerificationToken, createPasswordResetToken } from '@/lib/tokens';
export { verifyEmailToken, verifyPasswordResetToken, consumePasswordResetToken } from '@/lib/tokens';

let transporter: any = null;

async function getTransporter() {
  if (!transporter) {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'HEY <noreply@hey.ai>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'HEY';

export async function sendEmail(to: string, subject: string, html: string): Promise<void>
export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void>
export async function sendEmail(input: string | { to: string; subject: string; html: string }, subject?: string, html?: string) {
  const transport = await getTransporter();
  if (typeof input === 'string') {
    await transport.sendMail({
      from: FROM_EMAIL,
      to: input,
      subject: subject as string,
      html: html as string,
    });
  } else {
    await transport.sendMail({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}

export async function sendVerificationEmail(email: string, userId: string) {
  const token = await createVerificationToken(userId);
  const url = `${APP_URL}/verify?token=${token}`;
  const [{ render }, { VerificationEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(VerificationEmail({ url, appName: APP_NAME }));
  await sendEmail(email, `Verify your ${APP_NAME} account`, html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const [{ render }, { WelcomeEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(WelcomeEmail({ name, appName: APP_NAME, dashboardUrl: `${APP_URL}/dashboard` }));
  await sendEmail(email, `Welcome to ${APP_NAME}!`, html);
}

export async function sendPasswordResetEmail(email: string, userId: string) {
  const token = await createPasswordResetToken(userId);
  const url = `${APP_URL}/reset-password?token=${token}`;
  const [{ render }, { PasswordResetEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(PasswordResetEmail({ url, appName: APP_NAME }));
  await sendEmail(email, `Reset your ${APP_NAME} password`, html);
}

export async function sendBillingEmail(email: string, type: 'invoice' | 'failed' | 'canceled' | 'trial_ending', data: any) {
  const [{ render }, { BillingEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(BillingEmail({ type, data, appName: APP_NAME }));
  const subjects = {
    invoice: `Your ${APP_NAME} invoice`,
    failed: `Payment failed for ${APP_NAME}`,
    canceled: `Your ${APP_NAME} subscription was canceled`,
    trial_ending: `Your ${APP_NAME} trial is ending soon`,
  };
  await sendEmail(email, subjects[type], html);
}

export async function sendUsageLimitEmail(email: string, usage: { used: number; limit: number; resetDate: Date }) {
  const [{ render }, { UsageLimitEmail }] = await Promise.all([
    import('@react-email/render'),
    import('@/emails'),
  ]);
  const html = await render(UsageLimitEmail({ usage, appName: APP_NAME }));
  await sendEmail(email, `You've reached your ${APP_NAME} usage limit`, html);
}
