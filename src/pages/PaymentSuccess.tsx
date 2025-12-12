import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { analytics } from '@/lib/analytics';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    analytics.paymentSuccess(sessionId);
    
    // Refresh subscription status after a short delay to allow webhook to process
    const refreshSub = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshSubscription();
      setIsLoading(false);
    };
    
    refreshSub();
  }, [searchParams, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for upgrading to Premium. Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Activating your subscription...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You now have access to all premium features including advanced metadata editing,
              AI detection, and more.
            </p>
          )}
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : 'Start Using Premium Features'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
