import React from 'react';
export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        <article className="border-2 border-foreground p-6 md:p-8 lg:p-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono mb-2 border-b-2 border-foreground pb-2">PRIVACY POLICY</h1>
          <p className="text-muted-foreground mb-6 text-xs md:text-sm font-mono">LAST UPDATED: DECEMBER 2025</p>

          <p className="text-muted-foreground text-sm md:text-base mb-3">
            Oryno LLC. ("Oryno," "we," "us," or "our") is a technology provider dedicated to empowering users
            to ideate, build, and manage projects through our suite of digital tools. We are committed to ensuring
            compliance with applicable privacy laws in the jurisdictions where we operate.
          </p>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">1. DEFINITIONS AND SCOPE</h2>
            <p className="text-muted-foreground text-sm md:text-base mb-3">
              <strong>Personal Data:</strong> For the purposes of this Policy, "Personal Data" refers to any information that relates to an identified or identifiable natural person. This includes direct identifiers (such as names and email addresses) and technical identifiers (such as IP addresses, unique device tokens, and authentication logs).
            </p>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              <strong>Service Data:</strong> Metrics, telemetry, and aggregated usage statistics that Oryno processes independently for security, billing, resource optimization, and product analytics. Service Data is distinct from Customer Personal Data and is owned by Oryno.
            </p>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">2. COLLECTION AND USE OF INFORMATION</h2>
            <p className="text-muted-foreground mb-2 text-sm md:text-base">We collect data to ensure functionality, security, and improvement of our Services.</p>
            <h3 className="font-mono font-bold mt-3 text-sm">2.1 INFORMATION YOU PROVIDE DIRECTLY</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Account & Identity: name, email, and credentials.</li>
              <li>Billing Information: tokens, transaction history; we do not store full card details.</li>
              <li>User Content: project inputs, uploaded files processed to provide the Services.</li>
            </ul>
            <h3 className="font-mono font-bold mt-3 text-sm">2.2 INFORMATION COLLECTED AUTOMATICALLY</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Telemetry & Logs: API response times, feature usage, and error logs.</li>
              <li>Device Fingerprinting: IP addresses, browser types, and OS versions for security and fraud prevention.</li>
            </ul>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">3. LEGAL BASES FOR PROCESSING</h2>
            <p className="text-muted-foreground text-sm md:text-base">We process Personal Data only where a valid legal ground applies:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Performance of a Contract: to provide SaaS features and hosting.</li>
              <li>Legitimate Interests: security, fraud prevention, debugging, and improving product features.</li>
              <li>Legal Obligations: compliance with tax and reporting laws.</li>
              <li>Consent: for optional tracking and marketing communications where required.</li>
            </ul>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">4. PURPOSES OF PROCESSING</h2>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Service Delivery: provisioning account access and hosting user content.</li>
              <li>Security & Integrity: monitor suspicious activity and prevent unauthorized access.</li>
              <li>Product Evolution: analyze aggregated workflows to improve UI/UX.</li>
              <li>Transactional Communication: invoices and security notices.</li>
            </ul>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">5. DATA PROCESSING AND INFRASTRUCTURE</h2>
            <p className="text-muted-foreground text-sm md:text-base">We act as a Data Controller for account information and as a Data Processor for content you create within our tools. We engage trusted third-party sub-processors, such as cloud hosting and AI providers, on a pass-through basis.</p>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">6. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="text-muted-foreground text-sm md:text-base">Data may be transferred and processed in different jurisdictions under appropriate legal mechanisms, such as SCCs or adequacy decisions.</p>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">7. DATA RETENTION</h2>
            <p className="text-muted-foreground text-sm md:text-base">We retain Personal Data only for as long as necessary to fulfill the purposes outlined in this Policy, or as required by law.</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li><strong>Active Accounts:</strong> Data is retained for the duration of your subscription.</li>
              <li><strong>Deleted Accounts:</strong> Upon account termination, data acts are queued for deletion or anonymization within 90 days, retaining only what is necessary for tax and legal records.</li>
              <li><strong>Log Data:</strong> Technical logs are retained for a rolling period (typically up to 90 days) for security auditing.</li>
            </ul>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">8. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="text-muted-foreground text-sm md:text-base">We use cookies to operate and secure our Services.</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li><strong>Strictly Necessary Cookies:</strong> Essential for authentication and load balancing. These cannot be disabled.</li>
              <li><strong>Performance Cookies:</strong> Help us understand latency and usage patterns.</li>
              <li><strong>Functional Cookies:</strong> Store your UI preferences (e.g., dark mode).</li>
            </ul>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">9. SECURITY AND LIABILITY</h2>
            <p className="text-muted-foreground text-sm md:text-base">We implement industry-standard encryption (TLS 1.2+). No method of transmission is 100% secure; you are responsible for maintaining secure credentials.</p>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">10. UPDATES TO THIS POLICY</h2>
            <p className="text-muted-foreground text-sm md:text-base">We may update this Policy and will notify you of material changes via the Service or email.</p>
          </section>

          <section className="mt-6 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">11. CONTACT</h2>
            <p className="text-muted-foreground text-sm md:text-base">Contact: <a href="mailto:oryno80@gmail.com" className="text-primary">oryno80@gmail.com</a></p>
          </section>
        </article>
      </main>
    </div>
  );
}
