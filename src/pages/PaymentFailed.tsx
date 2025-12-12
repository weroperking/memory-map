import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analytics } from '@/lib/analytics';
import { useEffect } from 'react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    analytics.paymentFailed();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was not completed. No charges have been made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you experienced any issues or have questions, please contact our support team.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/')} className="w-full">
              Return to App
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
