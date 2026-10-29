import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description:
    'HEY Data Processing Agreement - the data-processing terms that apply when HEY processes personal data on your behalf',
  openGraph: {
    title: 'HEY Data Processing Agreement',
    description:
      'The data-processing terms that apply when HEY processes personal data on your behalf, including details on roles, security, sub-processors, and standard contractual clauses.',
    url: 'https://hey.ai/dpa',
    images: ['/og-image.png'],
  },
};

const lastUpdated = 'September 19, 2026';

const contact = (
  <>
    {' '}
    <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">
      privacy@hey.ai
    </a>
  </>
);

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Data Processing Agreement</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
          <p className="text-sm text-muted-foreground mx-auto max-w-xl">
            This page sets out the terms under which HEY processes personal data on your behalf and
            forms part of the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            . This is a general-purpose DPA template for the Service; if your organization requires
            an executed, jurisdiction-specific copy, email{' '}
            <a href="mailto:privacy@hey.ai" className="text-primary hover:underline">
              privacy@hey.ai
            </a>
            .
          </p>
        </header>

        <div className="space-y-10">
          <section id="parties">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">1. Parties and scope</h2>
            <p className="text-[15px] leading-relaxed">
              This Data Processing Agreement (&ldquo;DPA&rdquo;) applies whenever HEY processes
              personal data on behalf of a customer in connection with the Service, including data
              processed for team accounts provided under the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
              <li>
                The customer is the <strong>controller</strong> of the personal data they put into
                the Service.
              </li>
              <li>
                HEY is the <strong>processor</strong> of that data, acting on the customer&rsquo;s
                documented instructions.
              </li>
            </ul>
          </section>

          <section id="details">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              2. Details of processing
            </h2>
            <div className="space-y-2 text-[15px] leading-relaxed">
              <p>
                <strong>Subject matter and purpose:</strong> providing the HEY AI assistant and
                related features, including chat, memory, file processing, tasks, journal, and team
                collaboration, as described in the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
              <p>
                <strong>Categories of data subjects:</strong> the customer&rsquo;s authorized users
                (and, for team accounts, their members).
              </p>
              <p>
                <strong>Categories of personal data:</strong> account and profile details,
                conversations and messages, uploaded files and generated content, usage
                information, and subscription information.
              </p>
              <p>
                <strong>Duration:</strong> for the term of the customer&rsquo;s use of the Service,
                then as needed to comply with the retention and deletion commitments in the{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                and <Link href="/terms" className="text-primary hover:underline">Terms</Link>.
              </p>
            </div>
          </section>

          <section id="obligations">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              3. Processor obligations
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
              <li>Process personal data only on documented instructions, as described in this DPA and the Terms.</li>
              <li>Ensure persons authorized to process the data are under appropriate confidentiality obligations.</li>
              <li>Not use or disclose processed data for HEY&rsquo;s own purposes, except as permitted by this DPA or applicable law.</li>
              <li>Enable the customer to exercise their data-subject and account rights, including through the self-serve export and deletion tools in Settings.</li>
            </ul>
          </section>

          <section id="security">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">4. Security</h2>
            <p className="text-[15px] leading-relaxed">
              HEY maintains appropriate technical and organizational measures to protect personal
              data against accidental or unlawful destruction, loss, alteration, or unauthorized
              disclosure, including encryption of data in transit, access control tied to
              authenticated accounts, and secure deletion on request. Details are described in the{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section id="subprocessors">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">5. Sub-processors</h2>
            <p className="text-[15px] leading-relaxed">
              HEY may engage sub-processors to provide parts of the Service (for example, AI model
              providers, database hosting, and email delivery). When it does, HEY imposes
              contractual obligations on them that are substantially similar to this DPA and
              remains responsible to the customer for their acts and omissions. A current list of
              sub-processors is available on request at {contact}.
            </p>
          </section>

          <section id="international">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              6. International transfers and standard contractual clauses
            </h2>
            <p className="text-[15px] leading-relaxed">
              Personal data may be transferred outside the EEA, UK, and Switzerland to countries
              whose laws may not provide the same data-protection safeguards. Where such transfers
              occur and an appropriate adequacy decision does not apply, HEY relies on the European
              Commission&rsquo;s Standard Contractual Clauses (&ldquo;SCCs&rdquo;, EU 2021/914,
              including the relevant controller-to-processor and processor-to-processor modules) and
              any supplementary measures required, so that the data is afforded protection
              materially consistent with the <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. An executed copy of the SCCs is
              available on request at {contact}.
            </p>
          </section>

          <section id="data-subject-rights">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              7. Assistance with data-subject rights
            </h2>
            <p className="text-[15px] leading-relaxed">
              HEY supports the customer&rsquo;s obligations to respond to requests from data subjects
              under applicable law. Data subjects may exercise access, rectification, erasure,
              restriction, portability, and objection rights directly through the Service (including
              the export and delete tools in Settings) or by contacting us at {contact}.
            </p>
          </section>

          <section id="retention">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              8. Retention and deletion
            </h2>
            <p className="text-[15px] leading-relaxed">
              After the end of the customer&rsquo;s relationship with the Service, or upon the
              customer&rsquo;s request, HEY deletes or returns the customer&rsquo;s personal data in
              line with our retention commitments and legal obligations, unless retaining it is
              required by law.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">9. Contact</h2>
            <p className="text-[15px] leading-relaxed">
              For DPA, SCC, sub-processor, or audit inquiries, contact us at {contact} with the
              subject line &ldquo;DPA&rdquo;.
            </p>
          </section>

          <section id="disclaimer">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">10. Disclaimer</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              This page is a general description of the data-processing terms that apply to the
              Service and is provided for informational purposes only. It is not legal advice. For
              binding, organization-specific terms, request an executed DPA at {contact}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}