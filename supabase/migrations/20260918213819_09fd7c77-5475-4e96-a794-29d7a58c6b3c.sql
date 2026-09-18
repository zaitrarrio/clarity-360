CREATE TABLE public.plan_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version integer NOT NULL,
  change_note text,
  summary text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (business_id, version)
);

GRANT SELECT, INSERT ON public.plan_versions TO authenticated;
GRANT SELECT ON public.plan_versions TO anon;
GRANT ALL ON public.plan_versions TO service_role;

ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read plan versions" ON public.plan_versions
  FOR SELECT USING (public.can_read_business(business_id));

CREATE POLICY "write plan versions" ON public.plan_versions
  FOR INSERT TO authenticated WITH CHECK (public.can_write_business(business_id));

CREATE INDEX plan_versions_business_idx ON public.plan_versions (business_id, version DESC);