-- Enable row-level security for subscriptions if the table exists
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS select_own_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS no_client_insert ON public.subscriptions;
DROP POLICY IF EXISTS no_client_update ON public.subscriptions;
DROP POLICY IF EXISTS no_client_delete ON public.subscriptions;

-- Allow users to SELECT only their own subscriptions
CREATE POLICY select_own_subscriptions
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id);

-- Prevent direct client INSERT. Only WITH CHECK is allowed for INSERT policies.
CREATE POLICY no_client_insert
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Prevent direct client UPDATE.
CREATE POLICY no_client_update
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Prevent direct client DELETE.
CREATE POLICY no_client_delete
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (false);