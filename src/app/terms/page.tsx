import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'HEY Terms of Service - Rules and guidelines for using our AI assistant',
  openGraph: {
    title: 'HEY Terms of Service',
    description: 'HEY Terms of Service - Rules and guidelines for using our AI assistant',
    images: ['/og-image.png'],
    url: 'https://hey.ai/terms',
  },
};

const lastUpdated = 'September 14, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-8 prose prose-lg max-w-none">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using HEY ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part, you may not use the Service.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>HEY provides an AI-powered chat assistant using models from OpenAI, Anthropic, and other providers. Features include chat, code assistance, document analysis, image generation, and more, subject to your subscription plan.</p>
          </section>

          <section>
            <h2>3. Accounts</h2>
            <ul>
              <li>You must be 13+ years old to create an account</li>
              <li>Provide accurate, complete registration information</li>
              <li>Maintain password confidentiality</li>
              <li>Notify us immediately of unauthorized access</li>
              <li>One account per person; no sharing</li>
            </ul>
          </section>

          <section>
            <h2>4. Subscriptions & Billing</h2>
            <h3>Free Plan</h3>
            <p>100 messages/month, GPT-4o-mini only, basic features.</p>
            <h3>Paid Plans</h3>
            <ul>
              <li>Billed monthly or annually (20% discount)</li>
              <li>Auto-renewal unless canceled</li>
              <li>Price changes with 30 days notice</li>
              <li>No refunds for partial months (except as required by law)</li>
              <li>Manage in Settings → Billing</li>
            </ul>
            <h3>Trials</h3>
            <p>14-day Pro trial for new users. No credit card required. Features revert to Free after trial unless upgraded.</p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Generate illegal, harmful, or abusive content</li>
              <li>Attempt to extract model weights or training data</li>
              <li>Reverse engineer, scrape, or overload the Service</li>
              <li>Use for spam, malware, or automated abuse</li>
              <li>Violate intellectual property rights</li>
              <li>Impersonate others or misrepresent AI output as human</li>
              <li>Share account credentials or API keys</li>
            </ul>
            <p>We may suspend or terminate accounts violating these terms.</p>
          </section>

          <section>
            <h2>6. Content & Intellectual Property</h2>
            <ul>
              <li>You own your inputs and conversation history</li>
              <li>AI-generated outputs are yours to use commercially</li>
              <li>We claim no ownership over your content</li>
              <li>HEY branding, code, and design remain our property</li>
              <li>Feedback you provide becomes our property</li>
            </ul>
          </section>

          <section>
            <h2>7. Data & Privacy</h2>
            <p>Your data is governed by our <Link href="/privacy" className="underline">Privacy Policy</Link>. We do not use your conversations for model training. See Privacy Policy for details on data handling, retention, and your rights.</p>
          </section>

          <section>
            <h2>8. Third-Party Services</h2>
            <p>HEY integrates with third-party AI providers (OpenAI, Anthropic). Your use is subject to their terms. We are not responsible for their uptime, accuracy, or policies.</p>
          </section>

          <section>
            <h2>9. Disclaimers</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. AI OUTPUTS MAY BE INACCURATE, INCOMPLETE, OR BIASED. DO NOT RELY ON HEY FOR MEDICAL, LEGAL, FINANCIAL, OR SAFETY-CRITICAL DECISIONS.</p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEY SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE PRECEDING 12 MONTHS.</p>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify HEY from claims arising from your use of the Service, violation of these Terms, or infringement of third-party rights.</p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>We may terminate or suspend access immediately for violations. You may delete your account anytime in Settings. Paid subscriptions remain active until period end.</p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>These Terms are governed by California law. Disputes resolved in San Francisco courts. If you're outside the US, local consumer protections may apply.</p>
          </section>

          <section>
            <h2>14. Changes</h2>
            <p>We may modify these Terms. Material changes require 30 days notice via email and in-app. Continued use constitutes acceptance.</p>
          </section>

          <section>
            <h2>15. Contact</h2>
            <p>Questions? Contact us at legal@hey.ai or via our <Link href="/contact" className="underline">contact form</Link>.</p>
          </section>
        </div>

        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HEY. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/cookies" className="hover:underline">Cookie Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}