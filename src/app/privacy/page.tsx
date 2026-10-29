import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { ShieldCheck } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';
const effectiveDate = 'September 19, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How HEY collects, uses, and protects your information when you chat, upload, create, and work with our AI assistant — and the choices you control.',
  alternates: { canonical: `${baseUrl}/privacy` },
  openGraph: {
    title: 'Privacy Policy — HEY',
    description:
      'How HEY collects, uses, and protects your information across chat, memory, voice, files, and teams — and the choices you control.',
    url: `${baseUrl}/privacy`,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — HEY',
    description:
      'How HEY collects, uses, and protects your information — and the choices you control.',
    images: ['/og-image.png'],
  },
};

const sections = [
  { id: 'overview', label: '1. Overview' },
  { id: 'collect', label: '2. What we collect' },
  { id: 'use', label: '3. How we use it' },
  { id: 'ai', label: '4. How AI features work' },
  { id: 'share', label: '5. How we share it' },
  { id: 'retention', label: '6. Retention' },
  { id: 'rights', label: '7. Your choices & rights' },
  { id: 'security', label: '8. Security' },
  { id: 'children', label: '9. Children' },
  { id: 'international', label: '10. International transfers' },
  { id: 'changes', label: '11. Changes' },
  { id: 'contact', label: '12. Contact' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main" className="pt-32 lg:pt-40 pb-20 lg:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <span aria-hidden="true">←</span> About HEY
            </Link>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground">Effective: {effectiveDate}</p>
          </header>

          <section
            aria-label="At a glance"
            className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-12"
          >
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              At a glance
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                · HEY has no advertising business. We never sell your personal information.
              </li>
              <li>· Your content is not used to train our models.</li>
              <li>
                · Hand-gesture detection and voice playback run on your device; your video frames
                are not uploaded.
              </li>
              <li>
                · Marketing email and data-sharing preferences are off by default until you enable
                them.
              </li>
              <li>
                · You can download a copy of your data or delete your account at any time, free of
                charge, directly from Settings.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              This summary is for convenience. The full policy below is what governs your use of
              HEY, together with our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/cookies" className="underline hover:text-foreground">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <nav
            aria-label="Privacy policy contents"
            className="grid gap-2 sm:grid-cols-2 mb-12"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            <section id="overview" aria-labelledby="overview-h" className="scroll-mt-28">
              <h2 id="overview-h" className="text-2xl font-semibold tracking-tight mb-4">
                1. Overview
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>
                  This Privacy Policy explains how HEY (<em>“we”</em>, <em>“our”</em>,{' '}
                  <em>“us”</em>), provided by HEY AI, Inc. (San Francisco, California), collects,
                  uses, discloses, and protects your personal information when you use the HEY
                  service — including the website, the web application, the installable app, and
                  any related features, APIs, and companion surfaces (together, the{' '}
                  <em>“Service”</em>).
                </p>
                <p>
                  By creating an account or using the Service, you agree to this policy and to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  . If you do not agree with this policy, please do not use the Service.
                </p>
              </div>
            </section>

            <section id="collect" aria-labelledby="collect-h" className="scroll-mt-28">
              <h2 id="collect-h" className="text-2xl font-semibold tracking-tight mb-4">
                2. Information we collect
              </h2>
              <div className="space-y-5 text-[15px] leading-relaxed">
                <div>
                  <h3 className="font-semibold mb-2">Information you give us directly</h3>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>Account details, such as your name and email address.</li>
                    <li>
                      A password, which is stored only as a one-way cryptographic hash (bcrypt,
                      rounds 12) — never in plaintext.
                    </li>
                    <li>Optional profile information, such as a display image.</li>
                    <li>
                      Any content you provide to us directly — for example, through our contact
                      form or via email to support addresses.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Sign-in and account linking (Google, GitHub)
                  </h3>
                  <p>
                    If you sign in with Google or GitHub, we receive the profile information you
                    authorize that provider to share (typically your name, email address, and
                    avatar) and link it to your HEY account.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Content you create in the Service</h3>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>Conversations and messages, including the model used for each.</li>
                    <li>
                      Memories (facts, preferences, relationships, and projects you choose to
                      save), journal entries, tasks, goals, and habits.
                    </li>
                    <li>Documents and files you upload, along with extracted text we index.</li>
                    <li>Projects, custom agents, and their configurations.</li>
                    <li>
                      Team workspaces you own or join, including invitations, roles, and shared
                      messages.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage and technical information</h3>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>
                      Usage metrics for your account, such as message counts, token usage, and API
                      call counts by day, which we use to operate plan limits.
                    </li>
                    <li>
                      For security, an audit log captures limited technical data (such as your IP
                      address and browser user-agent) when you register, sign in, upload files,
                      generate images, run voice transcription, or perform similar sensitive
                      actions.
                    </li>
                    <li>
                      Device and app information, such as when you install the app and which push
                      notification subscription (if any) you register.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment information</h3>
                  <p>
                    When you subscribe to a paid plan, billing is processed by our payment provider
                    (Stripe). We receive and store a Stripe customer reference, your plan, and your
                    subscription status, but we do not see or store your full card number. Card
                    details are handled directly by Stripe under their own security requirements.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cookies and similar technologies</h3>
                  <p>
                    We use cookies and similar technologies to keep you signed in (a session token),
                    to protect requests (CSRF protection), to remember preferences, and to support
                    billing. For details, see our{' '}
                    <Link href="/cookies" className="text-primary hover:underline">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </section>

            <section id="use" aria-labelledby="use-h" className="scroll-mt-28">
              <h2 id="use-h" className="text-2xl font-semibold tracking-tight mb-4">
                3. How we use your information
              </h2>
              <ul className="space-y-2 text-[15px] leading-relaxed list-disc pl-5">
                <li>To provide, operate, personalize, and improve the Service.</li>
                <li>
                  To generate responses and results using AI features, as described in the next
                  section.
                </li>
                <li>To process payments, manage subscriptions, and prevent payment fraud.</li>
                <li>
                  To send transactional communications — including account verification, welcome
                  messages, password resets, billing notices, and usage-limit alerts.
                </li>
                <li>
                  To respond to your requests and provide customer support.
                </li>
                <li>
                  To maintain security, prevent abuse and unauthorized access, and investigate
                  incidents.
                </li>
                <li>To comply with legal obligations and enforce our terms.</li>
              </ul>
              <p className="mt-4 text-[15px] leading-relaxed">
                We do not use your personal information for advertising, and we do not sell it to
                anyone.
              </p>
            </section>

            <section id="ai" aria-labelledby="ai-h" className="scroll-mt-28">
              <h2 id="ai-h" className="text-2xl font-semibold tracking-tight mb-4">
                4. How our AI features work
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>
                  HEY connects you to leading AI models. To answer you, we transmit the relevant
                  conversation context to the third-party model provider that powers the model you
                  selected or the feature you are using. Depending on availability and configuration,
                  these providers may include{' '}
                  <strong>OpenAI</strong>, <strong>Anthropic</strong>, <strong>Google (Gemini)</strong>,
                  and, where enabled for your workspace, other compatible providers.
                </p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    <strong>Voice input.</strong> Audio you record is sent to a speech-to-text
                    provider (such as OpenAI Whisper or Groq) solely to transcribe it into your
                    message text.
                  </li>
                  <li>
                    <strong>Image generation.</strong> Your prompt is sent to an image-generation
                    provider (such as Google Imagen or OpenAI DALL·E) to create the image.
                  </li>
                  <li>
                    <strong>Files and vision.</strong> Files you ask us to index may be processed by
                    a vision or text model so their contents become searchable and referenceable.
                  </li>
                  <li>
                    <strong>Web research.</strong> Your research query may be sent to a web search
                    provider (such as SerpAPI) and summarized by an AI model that returns sourced
                    citations.
                  </li>
                </ul>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="font-semibold mb-1.5">What stays on your device</h3>
                  <p>
                    Hand-gesture control in the built-in terminal and spoken voice replies both run
                    on your device. Camera frames for gestures are processed locally and are not
                    uploaded to HEY or to model providers.
                  </p>
                </div>
                <p>
                  We do not use your content to train our models, and we do not permit your content
                  to define how HEY behaves for anyone else. Providers process the content you send
                  them in order to generate a response, under each provider&rsquo;s own terms.
                </p>
              </div>
            </section>

            <section id="share" aria-labelledby="share-h" className="scroll-mt-28">
              <h2 id="share-h" className="text-2xl font-semibold tracking-tight mb-4">
                5. How we share your information
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>
                  We share personal information only as needed to run the Service, with providers
                  that help us operate it, and where the law requires it. Examples of the
                  categories of providers we use include:
                </p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>AI model and processing providers (Section 4 above).</li>
                  <li>
                    Payment processing (Stripe) for subscriptions and billing.
                  </li>
                  <li>
                    Email delivery providers used to send transactional messages, such as
                    verification, welcome, and billing emails.
                  </li>
                  <li>
                    Error and performance monitoring (Sentry) to keep the Service reliable.
                  </li>
                  <li>
                    Web search providers (such as SerpAPI) when you use research features.
                  </li>
                </ul>
                <p>
                  Each provider receives only the information needed to perform its function and is
                  expected to protect it appropriately. We do not sell personal information, and we
                  do not share it with advertising networks.
                </p>
                <div>
                  <h3 className="font-semibold mb-2">Team workspaces</h3>
                  <p>
                    If you join a team workspace, the messages and content you share in that
                    workspace are visible to other members and, where configured, to workspace
                    owners and admins, according to the workspace&rsquo;s roles.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Legal and business reasons</h3>
                  <p>
                    We may disclose information when required by law, regulation, legal process, or
                    a valid governmental request, or when we believe in good faith that disclosure
                    is necessary to protect rights, safety, or property. In the event of a merger,
                    acquisition, or asset sale, your information may transfer as part of that
                    transaction, and we will provide notice where practical.
                  </p>
                </div>
              </div>
            </section>

            <section id="retention" aria-labelledby="retention-h" className="scroll-mt-28">
              <h2 id="retention-h" className="text-2xl font-semibold tracking-tight mb-4">
                6. Data retention
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>
                  We keep the information we collect only as long as needed to provide the Service,
                  support you, secure the platform, and meet legal or accounting obligations.
                </p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Account and content.</strong> Retained while your account is active and
                    for a reasonable period afterward to support recovery and legal needs.
                  </li>
                  <li>
                    <strong>Billing records.</strong> Retained as required for tax and accounting
                    purposes.
                  </li>
                  <li>
                    <strong>Security logs.</strong> Audit and security records are retained for as
                    long as they are needed to protect the Service.
                  </li>
                  <li>
                    <strong>Backups.</strong> Your data may temporarily persist in secured backups
                    created for disaster recovery, in line with our backup process.
                  </li>
                </ul>
                <p>
                  When you ask us to delete your personal information (see below), we will delete or
                  anonymize the data we hold about you, subject to the legal and security retention
                  described above.
                </p>
              </div>
            </section>

            <section id="rights" aria-labelledby="rights-h" className="scroll-mt-28">
              <h2 id="rights-h" className="text-2xl font-semibold tracking-tight mb-4">
                7. Your choices and rights
              </h2>
              <div className="space-y-5 text-[15px] leading-relaxed">
                <div>
                  <h3 className="font-semibold mb-2">Rights you can exercise at any time</h3>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>
                      <strong>Access and correction.</strong> View and update account information in
                      Settings, and contact us to correct anything you cannot change yourself.
                    </li>
                    <li>
                      <strong>Memory controls.</strong> Review and delete saved memories at any time
                      in the Memories board.
                    </li>
                    <li>
                      <strong>Data export.</strong> Download a portable copy of your data at any
                      time from Settings → Privacy &amp; Security → “Export My Data”. We provide it
                      in a commonly used, machine-readable format (JSON) covering your account,
                      chats, memories, files, tasks, journal, and more.
                    </li>
                    <li>
                      <strong>Deletion.</strong> Delete your account and all associated data at any
                      time from Settings → Danger Zone. This is irreversible and permanently
                      removes your data from the Service. If you need assistance, email{' '}
                      {`privacy@hey.ai`} from the address on your account and we will process your
                      request.
                    </li>
                    <li>
                      <strong>Marketing and notifications.</strong> Marketing email is off by
                      default; you can opt out or in at any time in Settings, and unsubscribe from
                      any marketing email with one click.
                    </li>
                    <li>
                      <strong>Push notifications.</strong> Enable or disable push notifications in
                      Settings or in your device/Browser permissions at any time.
                    </li>
                    <li>
                      <strong>Cookie choices.</strong> Manage cookies through your browser and our{' '}
                      <Link href="/cookies" className="text-primary hover:underline">
                        Cookie Policy
                      </Link>
                      .
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Regional rights</h3>
                  <p>
                    Depending on where you live, you may have additional rights under local law,
                    including rights to access, rectify, erase, restrict, or object to processing,
                    to receive a copy of your data (portability), and to withdraw consent where we
                    rely on it. You also have the right to lodge a complaint with your local data
                    protection authority. To exercise any of these rights, contact us using the
                    details in Section 12 — we will respond within the timeframe required by
                    applicable law.
                  </p>
                </div>
              </div>
            </section>

            <section id="security" aria-labelledby="security-h" className="scroll-mt-28">
              <h2 id="security-h" className="text-2xl font-semibold tracking-tight mb-4">
                8. Security
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>HEY is built with the following protections in place:</p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>
                    Data is transmitted over encrypted connections (TLS) between your device and the
                    Service, and to the providers we integrate with.
                  </li>
                  <li>Passwords are stored only as bcrypt hashes (rounds 12) — never plaintext.</li>
                  <li>
                    Account APIs require a valid authenticated session, sessions use signed tokens
                    with CSRF protection, and security headers are applied across the Service.
                  </li>
                  <li>
                    Sensitive account actions are recorded in audit logs so we can detect and
                    investigate unusual activity.
                  </li>
                  <li>
                    Card payments are handled by our payment provider (Stripe), which is responsible
                    for card data security (PCI DSS).
                  </li>
                </ul>
                <p>
                  No method of transmission or storage is completely secure. We work continuously to
                  protect your information, but we cannot guarantee absolute security, and you
                  remain responsible for keeping your access credentials confidential.
                </p>
              </div>
            </section>

            <section id="children" aria-labelledby="children-h" className="scroll-mt-28">
              <h2 id="children-h" className="text-2xl font-semibold tracking-tight mb-4">
                9. Children&rsquo;s privacy
              </h2>
              <p className="text-[15px] leading-relaxed">
                HEY is intended for individuals who are at least 13 years old. We do not knowingly
                collect personal information from children under 13. If you believe a child has
                provided us personal information, contact us at {`privacy@hey.ai`} and we will take
                steps to delete it.
              </p>
            </section>

            <section id="international" aria-labelledby="international-h" className="scroll-mt-28">
              <h2 id="international-h" className="text-2xl font-semibold tracking-tight mb-4">
                10. International data transfers
              </h2>
              <p className="text-[15px] leading-relaxed">
                Your information may be processed in the United States and in other countries where
                we or our service providers operate. When personal information is transferred across
                borders, we rely on appropriate safeguards where required by applicable law — for
                example, standard contractual clauses and the privacy commitments of our providers —
                so your information is protected consistent with this policy. See our{' '}
                <Link href="/dpa" className="text-primary hover:underline">
                  Data Processing Agreement
                </Link>{' '}
                for details.
              </p>
            </section>

            <section id="changes" aria-labelledby="changes-h" className="scroll-mt-28">
              <h2 id="changes-h" className="text-2xl font-semibold tracking-tight mb-4">
                11. Changes to this policy
              </h2>
              <p className="text-[15px] leading-relaxed">
                We may update this policy from time to time. When we do, we will revise the
                “Effective” date at the top of this page. If a change is material, we will take
                reasonable steps to notify you — for example, by email or within the Service —
                before it takes effect where feasible. Continued use of the Service after a change
                takes effect means you accept the updated policy.
              </p>
            </section>

            <section id="contact" aria-labelledby="contact-h" className="scroll-mt-28">
              <h2 id="contact-h" className="text-2xl font-semibold tracking-tight mb-4">
                12. Contact us
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed">
                <p>
                  Questions, requests, or concerns about this policy or your data? Reach us at:
                </p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>
                    Privacy: <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">privacy@hey.ai</a>
                  </li>
                  <li>
                    General support:{' '}
                    <a href="mailto:hello@hey.ai" className="text-primary hover:underline">hello@hey.ai</a>{' '}
                    or via our{' '}
                    <Link href="/contact" className="text-primary hover:underline">
                      contact form
                    </Link>
                  </li>
                  <li>
                    Security matters:{' '}
                    <a href="mailto:security@hey.ai" className="text-primary hover:underline">security@hey.ai</a>
                  </li>
                  <li>
                    Data Processing Agreement / SCCs:{' '}
                    <Link href="/dpa" className="text-primary hover:underline">
                      our DPA
                    </Link>{' '}
                    or request an executed copy at{' '}
                    <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">privacy@hey.ai</a>
                  </li>
                </ul>
                <p>
                  HEY AI, Inc.
                  <br />
                  San Francisco, California, United States
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} HEY AI, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About HEY
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">
                Cookies
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </footer>
        </div>
      </main>
      <Footer />
    </div>
  );
}