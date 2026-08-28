-- ============ enums ============
DO $$ BEGIN CREATE TYPE public.tenant_role AS ENUM ('owner','admin','member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.business_role AS ENUM ('owner','editor','viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ tenants ============
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_default boolean NOT NULL DEFAULT false,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_from_name text,
  email_from_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

CREATE TABLE public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  host text NOT NULL UNIQUE,
  verified boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tenant_domains TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO authenticated;
GRANT ALL ON public.tenant_domains TO service_role;

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.tenant_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;

CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;

CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.business_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_members TO authenticated;
GRANT ALL ON public.business_members TO service_role;

-- ============ default tenant + tenant_id columns ============
INSERT INTO public.tenants (slug, name, is_default, branding)
VALUES ('clarity360', 'Clarity 360', true, '{}'::jsonb);

ALTER TABLE public.businesses ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.businesses SET tenant_id = (SELECT id FROM public.tenants WHERE is_default);
ALTER TABLE public.businesses ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX businesses_tenant_idx ON public.businesses(tenant_id);

ALTER TABLE public.plan_progress ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
UPDATE public.plan_progress SET tenant_id = (SELECT id FROM public.tenants WHERE is_default);

-- backfill business owners as business members
INSERT INTO public.business_members (business_id, user_id, role)
SELECT id, user_id, 'owner'::public.business_role FROM public.businesses WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.tenant_role_of(_tenant_id uuid, _user_id uuid)
RETURNS public.tenant_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_members WHERE tenant_id = _tenant_id AND user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = _tenant_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = _user_id AND role IN ('owner','admin')
  ) OR public.is_platform_admin(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_read_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id
      AND (
        b.is_demo
        OR b.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.business_members m WHERE m.business_id = b.id AND m.user_id = auth.uid())
        OR public.is_tenant_admin(b.tenant_id, auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.business_members m
          WHERE m.business_id = b.id AND m.user_id = auth.uid() AND m.role IN ('owner','editor')
        )
        OR public.is_tenant_admin(b.tenant_id, auth.uid())
      )
  );
$$;

-- keep old owns_business helper aligned if present
CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_write_business(_business_id);
$$;

-- ============ RLS: tenants ============
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tenants" ON public.tenants FOR SELECT
  USING (is_default OR public.is_tenant_member(id, auth.uid()) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admins insert tenants" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "tenant admins update tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(id, auth.uid())) WITH CHECK (public.is_tenant_admin(id, auth.uid()));
CREATE POLICY "platform admins delete tenants" ON public.tenants FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS: tenant_domains ============
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tenant domains" ON public.tenant_domains FOR SELECT USING (true);
CREATE POLICY "tenant admins manage domains" ON public.tenant_domains FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_admin(tenant_id, auth.uid()));

-- ============ RLS: tenant_members ============
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tenant members" ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_admin(tenant_id, auth.uid()));
CREATE POLICY "tenant admins manage members" ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id, auth.uid()))
  WITH CHECK (public.is_tenant_admin(tenant_id, auth.uid()));

-- ============ RLS: platform_admins ============
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read platform admins" ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- ============ RLS: business_members ============
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read business members" ON public.business_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_read_business(business_id));
CREATE POLICY "manage business members" ON public.business_members FOR ALL TO authenticated
  USING (public.can_write_business(business_id))
  WITH CHECK (public.can_write_business(business_id));

-- ============ RLS: businesses ============
DROP POLICY IF EXISTS "read own or demo business" ON public.businesses;
DROP POLICY IF EXISTS "insert own business" ON public.businesses;
DROP POLICY IF EXISTS "update own business" ON public.businesses;
DROP POLICY IF EXISTS "delete own business" ON public.businesses;

CREATE POLICY "read business" ON public.businesses FOR SELECT
  USING (
    is_demo
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.business_members m WHERE m.business_id = id AND m.user_id = auth.uid())
    OR public.is_tenant_admin(tenant_id, auth.uid())
  );
CREATE POLICY "insert business" ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT is_demo);
CREATE POLICY "update business" ON public.businesses FOR UPDATE TO authenticated
  USING (public.can_write_business(id)) WITH CHECK (public.can_write_business(id));
CREATE POLICY "delete business" ON public.businesses FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_admin(tenant_id, auth.uid()));

-- ============ RLS: child tables now go through helpers ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['intake_responses','plan_sections','agents','actions','action_runs','agent_schedules','signals','conversations','messages']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "read" ON public.%I FOR SELECT USING (public.can_read_business(business_id))', t);
    EXECUTE format('CREATE POLICY "write" ON public.%I FOR ALL TO authenticated USING (public.can_write_business(business_id)) WITH CHECK (public.can_write_business(business_id))', t);
  END LOOP;
END $$;