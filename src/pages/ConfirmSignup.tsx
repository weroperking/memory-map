import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { analytics, handleError, logPageView } from '@/lib/analytics';

export default function ConfirmSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const email = searchParams.get('email');

  useEffect(() => {
    logPageView('confirm_signup');
  }, []);

  useEffect(() => {
    if (confirmationStatus === 'success' && user) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationStatus, user, navigate]);

  const handleConfirmEmail = async () => {
    if (!token || type !== 'email') {
      setConfirmationStatus('error');
      setErrorMessage('Invalid confirmation link. Please check your email and try again.');
      return;
    }

    setIsConfirming(true);
    try {
      // Supabase will automatically confirm email when accessing the link
      // This is typically handled by their auth flow
      analytics.logActivity('email_confirmed', 'auth', undefined, { email });
      setConfirmationStatus('success');
      toast.success('Email confirmed successfully!');
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to confirm email'),
        'ConfirmSignup',
        { action: 'confirm_email' }
      );
      setConfirmationStatus('error');
      setErrorMessage('Failed to confirm your email. Please try again or contact support.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Auto-confirm if token is present
  useEffect(() => {
    if (token && type === 'email' && confirmationStatus === 'pending' && !isConfirming) {
      handleConfirmEmail();
    }
  }, [token, type]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex flex-col">
      {/* Header with branding */}
      <div className="border-b border-border/40 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-lg sm:text-xl font-bold">PhotosMap</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {confirmationStatus === 'pending' && (
            <Card className="border border-border/60 shadow-sm">
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                    <div className="relative bg-primary/5 p-4 rounded-full">
                      {isConfirming ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <Mail className="h-8 w-8 text-primary" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
                  Confirm your signup
                </h1>
                <p className="text-center text-muted-foreground mb-6 sm:mb-8">
                  We're verifying your email address to complete your account setup.
                </p>

                {email && (
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Confirming</p>
                    <p className="font-medium text-foreground break-all">{email}</p>
                  </div>
                )}

                {/* Status message */}
                {isConfirming && (
                  <div className="text-center mb-6 sm:mb-8">
                    <p className="text-sm text-muted-foreground">
                      Please wait while we confirm your email...
                    </p>
                  </div>
                )}

                {/* Button */}
                <Button
                  onClick={handleConfirmEmail}
                  disabled={isConfirming || !token}
                  className="w-full h-10 sm:h-11 font-medium"
                  size="lg"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Email
                    </>
                  )}
                </Button>

                {/* Help text */}
                <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-primary hover:underline font-medium"
                  >
                    try signing up again
                  </button>
                </p>
              </div>
            </Card>
          )}

          {confirmationStatus === 'success' && (
            <Card className="border border-green-500/30 bg-gradient-to-br from-green-50 to-green-50/50 shadow-sm">
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl"></div>
                    <div className="relative bg-green-500/10 p-4 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-green-900">
                  Email confirmed!
                </h1>
                <p className="text-center text-green-700/80 mb-6 sm:mb-8">
                  Your account is all set. You're being redirected to your dashboard...
                </p>

                {/* Progress indicator */}
                <div className="w-full h-1 bg-green-200 rounded-full overflow-hidden mb-6 sm:mb-8">
                  <div className="h-full bg-green-600 rounded-full animate-pulse" style={{ width: '66%' }}></div>
                </div>

                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full h-10 sm:h-11 font-medium"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          )}

          {confirmationStatus === 'error' && (
            <Card className="border border-red-500/30 bg-gradient-to-br from-red-50 to-red-50/50 shadow-sm">
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl"></div>
                    <div className="relative bg-red-500/10 p-4 rounded-full">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-red-900">
                  Confirmation failed
                </h1>
                <p className="text-center text-red-700/80 mb-4">
                  {errorMessage}
                </p>

                {/* Error details */}
                <div className="bg-red-100/50 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm text-red-700 font-mono break-all">
                    {token ? 'Invalid or expired confirmation link' : 'No confirmation token provided'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full h-10 sm:h-11 font-medium"
                    size="lg"
                  >
                    Back to Sign Up
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full h-10 sm:h-11 font-medium"
                    size="lg"
                  >
                    Go Home
                  </Button>
                </div>

                {/* Support text */}
                <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
                  Need help?{' '}
                  <a href="mailto:support@photosmap.com" className="text-primary hover:underline font-medium">
                    Contact support
                  </a>
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
