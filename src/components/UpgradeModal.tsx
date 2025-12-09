import { Check, Sparkles, Zap, Shield, Download, Brain, X, Edit3, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeComplete?: () => void;
}

const mainFeatures = [
  { icon: Brain, text: 'AI-Generated Image Detection' },
  { icon: Edit3, text: 'Edit & Modify Image Metadata' },
  { icon: Package, text: 'Batch Process & Download Images' },
  { icon: Shield, text: 'Privacy Mode - Local Processing' },
];

const premiumMetadataFields = [
  'Focal Length', 'Color Space', 'Dots/Inch (DPI)',
  'Time Zone', 'Latitude Ref', 'Longitude Ref',
  'Altitude Ref', 'Direction Ref', 'Direction',
  'Pointing Direction', 'City', 'State', 'Country'
];

const plans = [
  {
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    popular: false,
  },
  {
    name: 'Yearly',
    price: '$29.99',
    period: '/year',
    popular: true,
    savings: 'Save 50%',
  },
  {
    name: 'Lifetime',
    price: '$79.99',
    period: 'one-time',
    popular: false,
  },
];

export function UpgradeModal({ isOpen, onClose, onUpgradeComplete }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-foreground p-0 shadow-lg">
        <div className="relative bg-gradient-to-br from-chart-4/30 via-background to-chart-2/20 p-6">
          <DialogHeader className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-foreground bg-chart-4 shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center font-mono text-2xl">
              Unlock PhotoMap Pro
            </DialogTitle>
            <p className="text-center text-muted-foreground">
              Get access to powerful features and take your photo organization to the next level
            </p>
          </DialogHeader>

          {/* Main Features */}
          <div className="mb-8">
            <h3 className="text-sm font-mono font-bold uppercase text-foreground mb-4">✨ Premium Features</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {mainFeatures.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 border-2 border-chart-4 bg-chart-4/5 p-3 rounded hover:bg-chart-4/10 transition-colors"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-chart-4 bg-chart-4 text-foreground rounded">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="mb-8">
            <h3 className="text-sm font-mono font-bold uppercase text-foreground mb-4">📊 Access 13 Premium Metadata Fields</h3>
            <div className="border-2 border-chart-4 bg-chart-4/5 rounded p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {premiumMetadataFields.map((field) => (
                  <div key={field} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-chart-4 flex-shrink-0" />
                    <span className="text-muted-foreground">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border-2 border-foreground bg-background p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md ${
                  plan.popular ? 'shadow-sm ring-2 ring-chart-4' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-chart-4 px-2 py-0.5 text-xs font-mono font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-center">
                  <p className="font-mono text-sm text-muted-foreground">{plan.name}</p>
                  <div className="my-2">
                    <span className="font-mono text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <span className="inline-block bg-chart-2 px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => {
                    onUpgradeComplete?.();
                    onClose();
                  }}
                  className={`mt-4 w-full ${
                    plan.popular
                      ? 'bg-chart-4 text-foreground hover:bg-chart-4/90'
                      : ''
                  } border-2 border-foreground`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Choose {plan.name}
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            All plans include a 7-day money-back guarantee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
