DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['intake_responses','plan_sections','agents','actions','action_runs','agent_schedules','signals','conversations','messages']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "write" ON public.%I', t);
    EXECUTE format($f$CREATE POLICY "read" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.is_demo OR b.user_id = auth.uid())))$f$, t);
    EXECUTE format($f$CREATE POLICY "write" ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()))$f$, t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.can_read_business(uuid);
DROP FUNCTION IF EXISTS public.owns_business(uuid);