import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: resolves the tenant for the current host (or /t/<slug> cookie). */
export const getTenant = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveTenant } = await import("./tenant.server");
  return resolveTenant();
});

/** Joins the signed-in user to the tenant they arrived through. */
export const joinCurrentTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenant, ensureMembership } = await import("./tenant.server");
    const tenant = await resolveTenant();
    const role = await ensureMembership(tenant.id, context.userId);
    return { tenantId: tenant.id, role };
  });

export const myTenantRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveTenant, tenantRoleOf, isPlatformAdmin } = await import("./tenant.server");
    const tenant = await resolveTenant();
    return {
      tenant,
      role: await tenantRoleOf(tenant.id, context.userId),
      platformAdmin: await isPlatformAdmin(context.userId),
    };
  });

const BrandingSchema = z.object({
  productName: z.string().max(60).optional(),
  logoText: z.string().max(60).optional(),
  logoUrl: z.string().max(500).optional(),
  faviconUrl: z.string().max(500).optional(),
  footerText: z.string().max(300).optional(),
  colorScheme: z.enum(["light", "dark"]).optional(),
  colors: z.record(z.string(), z.string().max(80)).optional(),
  fontDisplay: z.string().max(160).optional(),
  fontSans: z.string().max(160).optional(),
  fontLinkHref: z.string().max(500).optional(),
  heroTitle: z.string().max(200).optional(),
  heroBody: z.string().max(600).optional(),
  intakeNote: z.string().max(400).optional(),
  agentNames: z.record(z.string(), z.string().max(60)).optional(),
});

export const updateTenantBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tenantId: z.string().uuid(),
        name: z.string().min(1).max(80),
        branding: BrandingSchema,
        emailFromName: z.string().max(80).nullable(),
        emailFromAddress: z.string().max(160).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertTenantAdmin } = await import("./tenant.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertTenantAdmin(data.tenantId, context.userId);
    const { error } = await supabaseAdmin
      .from("tenants")
      .update({
        name: data.name,
        branding: data.branding as never,
        email_from_name: data.emailFromName,
        email_from_address: data.emailFromAddress,
      })
      .eq("id", data.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTenantMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tenantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertTenantAdmin } = await import("./tenant.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertTenantAdmin(data.tenantId, context.userId);
    const { data: rows } = await supabaseAdmin
      .from("tenant_members")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", data.tenantId)
      .order("created_at");
    const members = rows ?? [];
    const withEmail = await Promise.all(
      members.map(async (m) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
        return { ...m, email: u?.user?.email ?? "unknown" };
      }),
    );
    return withEmail;
  });

export const addTenantMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["owner", "admin", "member"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertTenantAdmin } = await import("./tenant.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertTenantAdmin(data.tenantId, context.userId);

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!target) throw new Error("No account with that email yet — ask them to sign in once first.");

    const { error } = await supabaseAdmin
      .from("tenant_members")
      .upsert(
        { tenant_id: data.tenantId, user_id: target.id, role: data.role },
        { onConflict: "tenant_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeTenantMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tenantId: z.string().uuid(), memberId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertTenantAdmin } = await import("./tenant.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertTenantAdmin(data.tenantId, context.userId);
    await supabaseAdmin.from("tenant_members").delete().eq("id", data.memberId).eq("tenant_id", data.tenantId);
    return { ok: true };
  });

/* ---------------- platform admin ---------------- */

async function requirePlatformAdmin(userId: string) {
  const { isPlatformAdmin } = await import("./tenant.server");
  if (!(await isPlatformAdmin(userId))) throw new Error("Platform admins only.");
}

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isPlatformAdmin } = await import("./tenant.server");
    // Non-admins get an empty, allowed:false result rather than a thrown error
    // so the screen can render a clear message instead of blanking out.
    if (!(await isPlatformAdmin(context.userId))) return { allowed: false as const, tenants: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tenants } = await supabaseAdmin
      .from("tenants")
      .select("id, slug, name, status, is_default, created_at")
      .order("created_at");
    const { data: domains } = await supabaseAdmin.from("tenant_domains").select("tenant_id, host, verified");
    return {
      allowed: true as const,
      tenants: (tenants ?? []).map((t) => ({
        ...t,
        domains: (domains ?? []).filter((d) => d.tenant_id === t.id),
      })),
    };
  });

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z
          .string()
          .min(2)
          .max(40)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
        name: z.string().min(1).max(80),
        host: z.string().max(200).optional(),
        ownerEmail: z.string().email().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .insert({ slug: data.slug, name: data.name })
      .select("id")
      .single();
    if (error || !tenant) throw new Error(error?.message ?? "Could not create the workspace.");

    if (data.host?.trim()) {
      await supabaseAdmin.from("tenant_domains").insert({
        tenant_id: tenant.id,
        host: data.host.trim().toLowerCase(),
        is_primary: true,
      });
    }

    if (data.ownerEmail?.trim()) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const owner = list?.users.find((u) => u.email?.toLowerCase() === data.ownerEmail!.toLowerCase());
      if (owner) {
        await supabaseAdmin
          .from("tenant_members")
          .upsert({ tenant_id: tenant.id, user_id: owner.id, role: "owner" }, { onConflict: "tenant_id,user_id" });
      }
    }
    return { id: tenant.id };
  });

export const setTenantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ tenantId: z.string().uuid(), status: z.enum(["active", "suspended"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("tenants").update({ status: data.status }).eq("id", data.tenantId);
    return { ok: true };
  });

export const addTenantDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tenantId: z.string().uuid(), host: z.string().min(3).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertTenantAdmin } = await import("./tenant.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertTenantAdmin(data.tenantId, context.userId);
    const { error } = await supabaseAdmin
      .from("tenant_domains")
      .insert({ tenant_id: data.tenantId, host: data.host.trim().toLowerCase() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
