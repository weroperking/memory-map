-- Migration: Add email to profiles and create monitoring/analytics tables

-- 1. Add email field to profiles table (denormalized from auth.users for faster access)
ALTER TABLE public.profiles
ADD COLUMN email TEXT NOT NULL DEFAULT '';

-- Add unique constraint on email (optional, depending on your auth setup)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Add index for email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 2. Create activity_logs table for user behavior tracking
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'photo_upload', 'photo_delete', 'map_view', 'metadata_edit', 'upgrade_view', 'upgrade_complete'
  resource_type VARCHAR(50), -- 'photo', 'subscription', 'profile'
  resource_id UUID,
  metadata JSONB, -- flexible field for action-specific data (e.g., file_size, location, count)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Index for user_id and created_at (common queries)
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- RLS: Users can only view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create app_metrics table for overall app health and usage
CREATE TABLE public.app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL, -- 'daily_active_users', 'photos_uploaded', 'subscriptions_active', 'avg_response_time', 'errors'
  metric_value NUMERIC NOT NULL,
  tags JSONB, -- flexible tags: {"version": "1.0", "region": "us-east"}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for queries by metric_type and date
CREATE INDEX idx_app_metrics_type_created ON public.app_metrics(metric_type, created_at DESC);

-- 4. Create error_logs table for debugging and monitoring
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component VARCHAR(100), -- 'PhotoUploader', 'PhotoMap', 'MetadataEditor', etc.
  severity VARCHAR(20) NOT NULL DEFAULT 'error', -- 'error', 'warning', 'critical'
  metadata JSONB, -- flexible: {"file_name": "...", "file_size": 123}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for severity and created_at
CREATE INDEX idx_error_logs_severity_created ON public.error_logs(severity, created_at DESC);
CREATE INDEX idx_error_logs_user_created ON public.error_logs(user_id, created_at DESC);

-- 5. Create feature_usage table to track specific feature adoption
CREATE TABLE public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL, -- 'map_style_selector', 'metadata_editor', 'batch_export', 'ai_detection'
  usage_count INT DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one row per user per feature
ALTER TABLE public.feature_usage
ADD CONSTRAINT unique_user_feature UNIQUE (user_id, feature_name);

-- Index for analytics
CREATE INDEX idx_feature_usage_created ON public.feature_usage(created_at DESC);

-- 6. Create storage_usage table to track per-user storage consumption
CREATE TABLE public.storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  photo_count INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for storage queries
CREATE INDEX idx_storage_usage_total_bytes ON public.storage_usage(total_bytes DESC);

-- 7. Update profiles table to sync email from auth.users on signup
-- This trigger will be created via the auth.users trigger (below)

-- Function to sync email to profiles when auth user is created
CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to sync email whenever auth.users.email changes
CREATE TRIGGER sync_email_on_auth_user_update
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_email_to_profile();

-- 8. Create a view for daily active users (example monitoring query)
CREATE OR REPLACE VIEW public.daily_active_users_view AS
SELECT 
  DATE(al.created_at) as activity_date,
  COUNT(DISTINCT al.user_id) as active_user_count,
  COUNT(*) as total_actions
FROM public.activity_logs al
GROUP BY DATE(al.created_at)
ORDER BY activity_date DESC;

-- 9. Create a view for subscription revenue tracking
CREATE OR REPLACE VIEW public.subscription_revenue_view AS
SELECT 
  DATE(s.created_at) as creation_date,
  s.plan,
  COUNT(*) as subscription_count,
  s.status
FROM public.subscriptions s
GROUP BY DATE(s.created_at), s.plan, s.status
ORDER BY creation_date DESC;

-- 10. RLS for app_metrics (read-only for authenticated users, for transparency)
ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view public metrics"
ON public.app_metrics FOR SELECT
USING (true);

-- 11. RLS for error_logs (admin only; if you have admin table, restrict here)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Error logs are not directly accessible to users"
ON public.error_logs FOR SELECT
USING (false);

-- 12. RLS for feature_usage
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feature usage"
ON public.feature_usage FOR SELECT
USING (auth.uid() = user_id);

-- 13. RLS for storage_usage
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own storage usage"
ON public.storage_usage FOR SELECT
USING (auth.uid() = user_id);

-- Timestamp update triggers for new tables
CREATE TRIGGER update_storage_usage_updated_at
BEFORE UPDATE ON public.storage_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
