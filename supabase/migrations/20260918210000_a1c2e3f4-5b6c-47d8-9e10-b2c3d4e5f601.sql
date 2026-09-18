-- Readiness items evolve: Clara can sharpen an existing item's description/
-- objective or propose a brand-new one as she learns more about the business.
-- `source` distinguishes the deterministic seed from what Clara discovered.
-- `objective` is the concrete, agent-actionable goal behind the item — the
-- thing an agent should go seek a solution, service, or answer for.
ALTER TABLE public.business_readiness_items
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'template' CHECK (source IN ('template', 'clara')),
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

-- One generated briefing per business per day: the headline, the body, and
-- which readiness items it chose to spotlight (so the UI can deep-link
-- straight into My Actions on the items the briefing is actually about).
CREATE TABLE public.business_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  briefing_date date NOT NULL DEFAULT current_date,
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

CREATE POLICY "read" ON public.business_briefings FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.business_briefings FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

CREATE INDEX business_briefings_business_date_idx ON public.business_briefings (business_id, briefing_date DESC);

CREATE TRIGGER touch_business_briefings_updated_at
BEFORE UPDATE ON public.business_briefings
FOR EACH ROW EXECUTE FUNCTION public.touch_business_readiness_updated_at();
