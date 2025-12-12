import React from 'react';
import { Link } from 'react-router-dom';

export default function LegalHub() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-mono mb-8 border-b-2 border-foreground pb-4">LEGAL HUB</h1>

          <div className="space-y-4">
            <Link to="/legal/privacy" className="block border-2 border-foreground p-6 hover:bg-foreground/5 transition">
              <h3 className="text-xl font-mono font-bold mb-2">PRIVACY POLICY</h3>
              <p className="text-sm text-muted-foreground">How we collect, use, and protect your personal information.</p>
            </Link>
            <Link to="/legal/terms" className="block border-2 border-foreground p-6 hover:bg-foreground/5 transition">
              <h3 className="text-xl font-mono font-bold mb-2">TERMS OF SERVICE</h3>
              <p className="text-sm text-muted-foreground">The terms and conditions governing your use of our services.</p>
            </Link>
            <Link to="/legal/refund" className="block border-2 border-foreground p-6 hover:bg-foreground/5 transition">
              <h3 className="text-xl font-mono font-bold mb-2">REFUND POLICY</h3>
              <p className="text-sm text-muted-foreground">Our policies regarding refunds and cancellations.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
