import { Check, Sparkles, X, Edit3, Package, Brain, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { analytics } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    price: '$7.99',
    period: '/month',
    popular: false,
  },
  {
    name: 'Yearly',
    price: '$47.99',
    period: '/year',
    popular: true,
    savings: 'Save 50%',
  },
  {
    name: 'Lifetime',
    price: '$119.99',
    period: 'one-time',
    popular: false,
  },
];

export function UpgradeModal({ isOpen, onClose, onUpgradeComplete }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      analytics.upgradeView('modal');
    }
  }, [isOpen]);

  const handleUpgrade = async (plan: string) => {
    try {
      setLoadingPlan(plan);
      
      const { data, error } = await supabase.functions.invoke('creem-checkout', {
        body: { plan }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }

      if (data?.checkoutUrl) {
        // Redirect to Creem checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to get checkout URL');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] border-2 border-foreground p-0 shadow-lg overflow-hidden">
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-50 h-8 w-8 bg-background/80 backdrop-blur-sm border border-foreground md:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <ScrollArea className="max-h-[90vh]">
          <div className="relative bg-gradient-to-br from-chart-4/30 via-background to-chart-2/20 p-4 sm:p-6">
            <DialogHeader className="mb-4 sm:mb-6">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center border-2 border-foreground bg-chart-4 shadow-sm">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <DialogTitle className="text-center font-mono text-xl sm:text-2xl">
                Unlock PhotoMap Pro
              </DialogTitle>
              <p className="text-center text-sm text-muted-foreground">
                Get access to powerful features and take your photo organization to the next level
              </p>
            </DialogHeader>

            {/* Main Features */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase text-foreground mb-3 sm:mb-4">✨ Premium Features</h3>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                {mainFeatures.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 sm:gap-3 border-2 border-chart-4 bg-chart-4/5 p-2 sm:p-3 rounded hover:bg-chart-4/10 transition-colors"
                  >
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center border-2 border-chart-4 bg-chart-4 text-foreground rounded">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase text-foreground mb-3 sm:mb-4">📊 Access 13 Premium Metadata Fields</h3>
              <div className="border-2 border-chart-4 bg-chart-4/5 rounded p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {premiumMetadataFields.map((field) => (
                    <div key={field} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-chart-4 flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative border-2 border-foreground bg-background p-3 sm:p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md ${
                    plan.popular ? 'shadow-sm ring-2 ring-chart-4' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-chart-4 px-2 py-0.5 text-xs font-mono font-bold whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-mono text-xs sm:text-sm text-muted-foreground">{plan.name}</p>
                    <div className="my-1.5 sm:my-2">
                      <span className="font-mono text-2xl sm:text-3xl font-bold">{plan.price}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <span className="inline-block bg-chart-2 px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        {plan.savings}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={loadingPlan !== null}
                    className={`mt-3 sm:mt-4 w-full text-sm ${
                      plan.popular
                        ? 'bg-chart-4 text-foreground hover:bg-chart-4/90'
                        : ''
                    } border-2 border-foreground`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {loadingPlan === plan.name ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </div>
              ))}
            </div>


          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
