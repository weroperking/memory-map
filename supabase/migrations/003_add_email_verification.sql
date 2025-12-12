-- Migration: Add email verification columns to profiles table

-- Add email verification fields to profiles
ALTER TABLE public.profiles
ADD COLUMN email_verification_code TEXT,
ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for verification code lookups
CREATE INDEX idx_profiles_verification_code ON public.profiles(email_verification_code);

-- Create email_verification_logs table for audit trail
CREATE TABLE public.email_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'sent', 'verified', 'expired'
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verification_logs ENABLE ROW LEVEL SECURITY;

-- Index for user_id queries
CREATE INDEX idx_email_verification_logs_user ON public.email_verification_logs(user_id);
CREATE INDEX idx_email_verification_logs_code ON public.email_verification_logs(verification_code);

-- RLS: Users can only view their own verification logs
CREATE POLICY "Users can view their own email verification logs"
ON public.email_verification_logs FOR SELECT
USING (auth.uid() = user_id);
