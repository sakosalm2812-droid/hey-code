import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Column } from '@react-email/column';
import { Text } from '@react-email/text';
import { Button } from '@react-email/button';
import { Link } from '@react-email/link';

interface BillingEmailProps {
  type: 'invoice' | 'failed' | 'canceled' | 'trial_ending';
  data: any;
  appName: string;
}

export function BillingEmail({ type, data, appName }: BillingEmailProps) {
  const configs = {
    invoice: {
      heading: 'Your invoice is ready',
      body: `Your invoice for ${data.amount} has been generated. You can view and download it from your billing dashboard.`,
      buttonText: 'View Invoice',
      buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    },
    failed: {
      heading: 'Payment failed',
      body: `We couldn't process your payment for ${data.amount}. Please update your payment method to avoid service interruption.`,
      buttonText: 'Update Payment Method',
      buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    },
    canceled: {
      heading: 'Subscription canceled',
      body: `Your ${data.plan} subscription has been canceled. You'll continue to have access until ${data.periodEnd}.`,
      buttonText: 'Reactivate',
      buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    },
    trial_ending: {
      heading: 'Your trial ends soon',
      body: `Your free trial ends in ${data.daysLeft} days. Upgrade now to continue enjoying all Pro features.`,
      buttonText: 'Upgrade Now',
      buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    },
  };

  const config = configs[type];

  return (
    <Html lang="en">
      <Head />
      <Preview>{appName} - {config.heading}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Column>
              <Text style={logoStyle}>{appName}</Text>
            </Column>
          </Section>
          <Section style={contentStyle}>
            <Column>
              <Text style={headingStyle}>{config.heading}</Text>
              <Text style={bodyStyle}>{config.body}</Text>
              <Button style={buttonStyle} href={config.buttonUrl}>
                {config.buttonText}
              </Button>
            </Column>
          </Section>
          <Section style={footerSectionStyle}>
            <Column>
              <Text style={copyrightStyle}>© {new Date().getFullYear()} {appName}. All rights reserved.</Text>
            </Column>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle = { fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif', backgroundColor: '#f6f9fc' };
const containerStyle = { maxWidth: '600px', margin: '0 auto', padding: '20px' };
const headerStyle = { padding: '40px 0 20px', textAlign: 'center' as const };
const logoStyle = { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: 0 };
const contentStyle = { backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const headingStyle = { fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 16px', textAlign: 'center' as const };
const bodyStyle = { fontSize: '16px', lineHeight: '1.6', color: '#4a4a6a', margin: '0 0 24px', textAlign: 'center' as const };
const buttonStyle = { backgroundColor: '#1a1a2e', color: '#ffffff', borderRadius: '6px', padding: '14px 28px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', margin: '0 auto' };
const footerSectionStyle = { padding: '20px 0', textAlign: 'center' as const };
const copyrightStyle = { fontSize: '12px', color: '#999', margin: 0 };