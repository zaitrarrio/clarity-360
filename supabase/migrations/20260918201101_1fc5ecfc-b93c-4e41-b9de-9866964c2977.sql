CREATE TABLE public.business_readiness_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'needs_help', 'complete')),
  priority integer NOT NULL DEFAULT 0,
  help_kind text NOT NULL DEFAULT 'clara' CHECK (help_kind IN ('clara', 'agent', 'integration', 'guide')),
  help_target text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_readiness_items TO authenticated;
GRANT ALL ON public.business_readiness_items TO service_role;

ALTER TABLE public.business_readiness_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can read readiness items"
ON public.business_readiness_items
FOR SELECT
TO authenticated
USING (public.owns_business(business_id));

CREATE POLICY "owners can create readiness items"
ON public.business_readiness_items
FOR INSERT
TO authenticated
WITH CHECK (public.owns_business(business_id));

CREATE POLICY "owners can update readiness items"
ON public.business_readiness_items
FOR UPDATE
TO authenticated
USING (public.owns_business(business_id))
WITH CHECK (public.owns_business(business_id));

CREATE POLICY "owners can delete readiness items"
ON public.business_readiness_items
FOR DELETE
TO authenticated
USING (public.owns_business(business_id));

CREATE INDEX business_readiness_items_business_priority_idx
ON public.business_readiness_items (business_id, priority, category);

CREATE OR REPLACE FUNCTION public.touch_business_readiness_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_business_readiness_updated_at
BEFORE UPDATE ON public.business_readiness_items
FOR EACH ROW EXECUTE FUNCTION public.touch_business_readiness_updated_at();