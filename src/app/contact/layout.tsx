import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact HEY for support, feedback, or bug reports',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}