import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'HEY Cookie Policy - How we use cookies, local storage, and related technologies',
  openGraph: {
    title: 'HEY Cookie Policy',
    description: 'HEY Cookie Policy - How we use cookies, local storage, and related technologies',
    images: ['/og-image.png'],
    url: 'https://hey.ai/cookies',
  },
};

const lastUpdated = 'September 19, 2026';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <div className="space-y-8 max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. What Are Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit websites. Some sites also use
              browser storage technologies such as localStorage that behave similarly. HEY uses cookies only
              where they are needed to keep you signed in and keep the service secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              HEY sets authentication and security cookies so that you can sign in, stay signed in between
              visits, and have your requests protected against cross-site request forgery. We do not set
              advertising, social, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Cookies We Set</h2>

            <h3 className="font-semibold mb-2 mt-6">Essential Cookies (Always Active)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.session-token</td>
                    <td className="py-2 pr-4 align-top">Authentication session</td>
                    <td className="py-2 align-top">30 days</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.csrf-token</td>
                    <td className="py-2 pr-4 align-top">CSRF protection</td>
                    <td className="py-2 align-top">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">next-auth.callback-url</td>
                    <td className="py-2 pr-4 align-top">OAuth redirect</td>
                    <td className="py-2 align-top">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold mb-2 mt-6">Payments (Set by Stripe Checkout)</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you subscribe via Stripe Checkout, Stripe may place its own cookies on Stripe-hosted
              checkout pages for fraud prevention and payment-session continuity.
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="py-2 pr-4 align-top">__stripe_mid</td>
                    <td className="py-2 pr-4 align-top">Fraud prevention</td>
                    <td className="py-2 align-top">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">__stripe_sid</td>
                    <td className="py-2 pr-4 align-top">Payment session</td>
                    <td className="py-2 align-top">30 minutes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold mb-2 mt-6">Local Storage (Not Cookies)</h3>
            <p className="text-muted-foreground leading-relaxed">
              HEY stores preferences such as your color theme and sidebar state in your browser&apos;s local
              storage rather than in cookies. This data never leaves your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Analytics and Error Monitoring</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>In-product usage:</strong> HEY measures usage such as message counts and token usage in
                our own systems. These metrics tie to your account for quota enforcement and are not sent to
                third-party analytics vendors, and no tracking cookies are involved.
              </li>
              <li>
                <strong>Error monitoring:</strong> When an error occurs, technical error data may be sent to our
                error-monitoring provider (Sentry) to help us fix problems. This does not require cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Your Choices</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Essential cookies:</strong> Cannot be disabled while the service needs them for sign-in and security.</li>
              <li><strong>Local storage:</strong> Preferences are stored on your device only; clear them via your browser settings.</li>
              <li><strong>All cookies:</strong> Clearing cookies in your browser signs you out until you sign in again.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              For any questions about our data practices, see our{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> or contact{' '}
              <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">privacy@hey.ai</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Do Not Track</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not use third-party tracking or advertising cookies, so there are no tracking cookies to
              disable in response to a Do Not Track signal. The preferences and error data described above are
              controlled through this policy and your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. Changes are posted on this page with an updated
              date, and material changes are announced on the{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">Questions about cookies? Email privacy@hey.ai</p>
          </section>
        </div>

        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HEY. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}