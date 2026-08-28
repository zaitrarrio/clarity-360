CREATE TABLE public.plan_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mode text NOT NULL,
  seed_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode, seed_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_progress TO authenticated;
GRANT ALL ON public.plan_progress TO service_role;

ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plan progress"
ON public.plan_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_plan_progress_updated_at
BEFORE UPDATE ON public.plan_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();