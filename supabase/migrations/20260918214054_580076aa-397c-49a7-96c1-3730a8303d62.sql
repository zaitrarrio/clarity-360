ALTER TABLE public.business_readiness_items
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'template',
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.business_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  headline text NOT NULL,
  body text NOT NULL,
  focus_item_keys text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, briefing_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_briefings TO authenticated;
GRANT SELECT ON public.business_briefings TO anon;
GRANT ALL ON public.business_briefings TO service_role;

ALTER TABLE public.business_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Readable briefings" ON public.business_briefings
  FOR SELECT USING (public.can_read_business(business_id));

CREATE POLICY "Writable briefings" ON public.business_briefings
  FOR ALL USING (public.can_write_business(business_id))
  WITH CHECK (public.can_write_business(business_id));