import { getRequestHeader } from "@tanstack/react-start/server";
import { DEFAULT_TENANT, TENANT_COOKIE, type Tenant, type TenantBranding } from "./tenant";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const SELECT = "id, slug, name, status, is_default, branding, email_from_name, email_from_address";

function shape(row: Record<string, unknown> | null): Tenant | null {
  if (!row) return null;
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    status: String(row["status"]),
    is_default: Boolean(row["is_default"]),
    branding: (row["branding"] ?? {}) as TenantBranding,
    email_from_name: (row["email_from_name"] as string | null) ?? null,
    email_from_address: (row["email_from_address"] as string | null) ?? null,
  };
}

function hostname(): string {
  const raw = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "";
  return raw.split(",")[0]!.trim().split(":")[0]!.toLowerCase();
}

function cookieSlug(): string {
  const raw = getRequestHeader("cookie") ?? "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${TENANT_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export async function defaultTenant(): Promise<Tenant> {
  const client = await db();
  const { data } = await client.from("tenants").select(SELECT).eq("is_default", true).maybeSingle();
  return shape(data as never) ?? DEFAULT_TENANT;
}

export async function tenantBySlug(slug: string): Promise<Tenant | null> {
  if (!slug) return null;
  const client = await db();
  const { data } = await client.from("tenants").select(SELECT).eq("slug", slug).maybeSingle();
  return shape(data as never);
}

/**
 * Host match first (subdomain or custom domain), then the /t/<slug> cookie set
 * by the path-prefix entry route, then the default Clarity 360 tenant.
 */
export async function resolveTenant(): Promise<Tenant> {
  const client = await db();
  const host = hostname();

  if (host) {
    const { data: domain } = await client
      .from("tenant_domains")
      .select("tenant_id")
      .eq("host", host)
      .maybeSingle();
    if (domain?.tenant_id) {
      const { data } = await client.from("tenants").select(SELECT).eq("id", domain.tenant_id).maybeSingle();
      const tenant = shape(data as never);
      if (tenant && tenant.status === "active") return tenant;
    }
    const sub = host.split(".")[0] ?? "";
    if (sub && !["www", "localhost", "id-preview--209ec56e-2492-40e7-8533-9f8e67bf3605"].includes(sub)) {
      const bySub = await tenantBySlug(sub);
      if (bySub && bySub.status === "active") return bySub;
    }
  }

  const fromCookie = await tenantBySlug(cookieSlug());
  if (fromCookie && fromCookie.status === "active") return fromCookie;

  return defaultTenant();
}

/** The tenant the caller is acting inside, plus their role in it. */
export async function tenantRoleOf(tenantId: string, userId: string): Promise<string | null> {
  const client = await db();
  const { data } = await client
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as string | undefined) ?? null;
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const client = await db();
  const { data } = await client.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function assertTenantAdmin(tenantId: string, userId: string) {
  const role = await tenantRoleOf(tenantId, userId);
  if (role === "owner" || role === "admin") return role;
  if (await isPlatformAdmin(userId)) return "platform_admin";
  throw new Error("You do not have permission to change this workspace.");
}

/** Ensures a signed-in user is a member of the tenant they arrived through. */
export async function ensureMembership(tenantId: string, userId: string) {
  const client = await db();
  const existing = await tenantRoleOf(tenantId, userId);
  if (existing) return existing;
  const { count } = await client
    .from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  const role = (count ?? 0) === 0 ? "owner" : "member";
  await client.from("tenant_members").insert({ tenant_id: tenantId, user_id: userId, role });
  return role;
}
