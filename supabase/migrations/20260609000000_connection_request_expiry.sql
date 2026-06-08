-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to cancel stale connection requests
CREATE OR REPLACE FUNCTION public.cancel_stale_connection_requests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.connection_requests
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE 
    status = 'assigned'
    AND assigned_at < now() - INTERVAL '48 hours';
END;
$$;

-- Grant execution permission to authenticated users and service role (for safety)
GRANT EXECUTE ON FUNCTION public.cancel_stale_connection_requests() TO authenticated, service_role;

-- Unschedule the job first if it already exists to ensure idempotency
SELECT cron.unschedule('cancel-stale-connection-requests-cron')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-stale-connection-requests-cron'
);

-- Schedule the cron job to run every 6 hours
SELECT cron.schedule(
  'cancel-stale-connection-requests-cron',
  '0 */6 * * *',
  'SELECT public.cancel_stale_connection_requests()'
);
