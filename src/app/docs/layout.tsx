import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Complete API reference for HEY. All endpoints require authentication via session cookie or API key.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}