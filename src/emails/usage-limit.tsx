import { Html } from '@react-email/html';
import { Head } from '@react-email/head';
import { Preview } from '@react-email/preview';
import { Body } from '@react-email/body';
import { Container } from '@react-email/container';
import { Section } from '@react-email/section';
import { Column } from '@react-email/column';
import { Text } from '@react-email/text';
import { Button } from '@react-email/button';

interface UsageLimitEmailProps {
  usage: { used: number; limit: number; resetDate: Date };
  appName: string;
}

export function UsageLimitEmail({ usage, appName }: UsageLimitEmailProps) {
  const percent = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const resetStr = usage.resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <Html lang="en">
      <Head />
      <Preview>{appName} - Usage limit reached</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Column>
              <Text style={logoStyle}>{appName}</Text>
            </Column>
          </Section>
          <Section style={contentStyle}>
            <Column>
              <Text style={headingStyle}>You've reached your monthly limit</Text>
              <Text style={bodyStyle}>
                You've used {usage.used} of {usage.limit} messages this month. Your limit resets on {resetStr}.
              </Text>
              <div style={progressContainer}>
                <div style={{ ...progressBar, width: `${percent}%` }} />
              </div>
              <Text style={progressText}>{percent}% used</Text>
              <Button style={buttonStyle} href={`${process.env.NEXT_PUBLIC_APP_URL}`}>
                Upgrade for unlimited messages
              </Button>
              <Text style={footerStyle}>
                Free plan: 100 messages/month · Pro plan: Unlimited messages
              </Text>
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
const progressContainer = { width: '100%', height: '8px', backgroundColor: '#eaeef5', borderRadius: '4px', margin: '24px 0', overflow: 'hidden' };
const progressBar = { height: '100%', backgroundColor: '#1a1a2e', borderRadius: '4px', transition: 'width 0.3s ease' };
const progressText = { fontSize: '14px', color: '#888', textAlign: 'center' as const, marginTop: '8px' };
const buttonStyle = { backgroundColor: '#1a1a2e', color: '#ffffff', borderRadius: '6px', padding: '14px 28px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', margin: '24px auto 0' };
const footerStyle = { fontSize: '14px', color: '#888', marginTop: '24px', textAlign: 'center' as const };
const footerSectionStyle = { padding: '20px 0', textAlign: 'center' as const };
const copyrightStyle = { fontSize: '12px', color: '#999', margin: 0 };