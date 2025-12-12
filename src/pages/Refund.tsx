import React from 'react';
export default function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        <article className="border-2 border-foreground p-6 md:p-8 lg:p-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono mb-2 border-b-2 border-foreground pb-2">REFUND AND CANCELLATION POLICY</h1>
          <p className="text-muted-foreground mb-6 text-xs md:text-sm font-mono">LAST UPDATED: DECEMBER 2025</p>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">1. OVERVIEW AND DIGITAL NATURE OF SERVICES</h2>
            <p className="text-muted-foreground text-sm md:text-base">Oryno provides digital SaaS solutions. Due to the immediate provisioning of services, our offerings are generally non-refundable.</p>
          </section>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">2. GENERAL REFUND POLICY</h2>
            <div className="border-2 border-destructive p-4 mb-4">
              <p className="text-foreground font-mono font-bold text-sm md:text-base">ALL SALES ARE FINAL.</p>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">By purchasing a subscription, you acknowledge that the service is delivered the moment access is granted. We do not offer refunds for change of mind, lack of usage, or technical limitations on the client side.</p>
          </section>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">3. SUBSCRIPTION COMMITMENTS AND CANCELLATION</h2>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>Commitment to the term: subscription covers the full billing period.</li>
              <li>Cancellation: you may cancel to prevent future renewals; no prorated refunds are issued.</li>
              <li>No prorated refunds: cancellation does not pro-rate or refund the remaining term.</li>
            </ul>
          </section>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">4. LIMITED ELIGIBILITY FOR REFUNDS</h2>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">While our general policy is strict, we recognize that exceptional errors can occur. Refunds are granted at the sole discretion of Oryno and are strictly limited to the following specific scenarios:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-3 text-sm md:text-base">
              <li><strong>Billing Administrative Errors:</strong> If you were charged more than the listed price or charged multiple times for a single invoice due to a system error.</li>
              <li><strong>Critical Service Failure:</strong> If the service is verified by our engineering team to be completely unavailable for a duration exceeding the limits defined in our Service Level Agreement (SLA), you may be eligible for a partial refund or service credit.</li>
              <li><strong>Unauthorized Charges:</strong> If a charge is verified as fraudulent or unauthorized by your financial institution.</li>
            </ul>
            <div className="border-2 border-foreground p-4 mt-4">
              <p className="text-muted-foreground text-xs md:text-sm"><strong>NOTE:</strong> Minor bugs, temporary glitches, or downtime falling within our standard maintenance windows do not constitute Critical Service Failure.</p>
            </div>
          </section>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">5. NON-REFUNDABLE ITEMS AND SERVICES</h2>
            <ul className="list-disc list-inside text-muted-foreground mt-2">
              <li>SaaS subscription fees once the term begins.</li>
              <li>Custom development fees once work commences.</li>
              <li>Past transactions charged more than 7 days prior.</li>
            </ul>
          </section>

          <section className="mt-4 border-t-2 border-foreground pt-4">
            <h2 className="text-lg font-mono font-bold mb-2">6. DISPUTE AND REVIEW PROCESS</h2>
            <p className="text-muted-foreground text-sm md:text-base">To dispute a charge, contact support with your account email, transaction ID, and detailed explanation. Review may take up to 5 business days; if approved, refunds are processed within 10 business days.</p>
            <p className="text-muted-foreground text-xs md:text-sm mt-2">Contact: <a href="mailto:oryno80@gmail.com" className="text-primary">oryno80@gmail.com</a></p>
          </section>
        </article>
      </main>
    </div>
  );
}
