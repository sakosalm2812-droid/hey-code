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

interface WelcomeEmailProps {
  name: string;
  appName: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ name, appName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to {appName}!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Column>
              <Text style={logoStyle}>{appName}</Text>
            </Column>
          </Section>
          <Section style={contentStyle}>
            <Column>
              <Text style={headingStyle}>Welcome to {appName}, {name}! 👋</Text>
              <Text style={bodyStyle}>
                You're now part of the future of AI assistance. {appName} is your personal Jarvis-like assistant that helps you think, create, and get things done.
              </Text>
              <Text style={bodyStyle}>
                Here's what you can do right now:
              </Text>
              <Text style={bulletStyle}>• Chat with GPT-4o, Claude 3, and more</Text>
              <Text style={bulletStyle}>• Save and organize conversations</Text>
              <Text style={bulletStyle}>• Access from any device with PWA support</Text>
              <Text style={bulletStyle}>• Use voice input (Pro feature)</Text>
              <Button style={buttonStyle} href={dashboardUrl}>
                Start Chatting
              </Button>
              <Text style={footerStyle}>
                Need help? Reply to this email or visit our <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/contact`}>contact page</Link>.
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
const bodyStyle = { fontSize: '16px', lineHeight: '1.6', color: '#4a4a6a', margin: '0 0 16px', textAlign: 'center' as const };
const bulletStyle = { fontSize: '16px', lineHeight: '2', color: '#4a4a6a', margin: '0 0 8px', textAlign: 'left' as const };
const buttonStyle = { backgroundColor: '#1a1a2e', color: '#ffffff', borderRadius: '6px', padding: '14px 28px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', margin: '24px auto 0' };
const footerStyle = { fontSize: '14px', color: '#888', marginTop: '24px', textAlign: 'center' as const };
const footerSectionStyle = { padding: '20px 0', textAlign: 'center' as const };
const copyrightStyle = { fontSize: '12px', color: '#999', margin: 0 };