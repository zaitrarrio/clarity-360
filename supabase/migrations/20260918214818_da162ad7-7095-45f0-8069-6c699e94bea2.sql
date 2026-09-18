DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_readiness_items_source_check') THEN
    ALTER TABLE public.business_readiness_items
      ADD CONSTRAINT business_readiness_items_source_check CHECK (source IN ('template', 'clara'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS business_briefings_business_date_idx
  ON public.business_briefings (business_id, briefing_date DESC);

DROP TRIGGER IF EXISTS touch_business_briefings_updated_at ON public.business_briefings;
CREATE TRIGGER touch_business_briefings_updated_at
BEFORE UPDATE ON public.business_briefings
FOR EACH ROW EXECUTE FUNCTION public.touch_business_readiness_updated_at();

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('clarity-agents-tick', 'clarity-briefing-tick');

SELECT cron.schedule(
  'clarity-agents-tick',
  '5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--209ec56e-2492-40e7-8533-9f8e67bf3605.lovable.app/api/public/agents-tick',
    headers := '{"content-type":"application/json","apikey":"sb_publishable_q0qRWJEXcwPaJoFwTUjc-Q_AG8-dHHw"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);

SELECT cron.schedule(
  'clarity-briefing-tick',
  '0 11 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--209ec56e-2492-40e7-8533-9f8e67bf3605.lovable.app/api/public/briefing-tick',
    headers := '{"content-type":"application/json","apikey":"sb_publishable_q0qRWJEXcwPaJoFwTUjc-Q_AG8-dHHw"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $cron$
);