import { createContext, useContext } from "react";
import { AGENT_NAMES } from "./clarity";

export type TenantBranding = {
  productName?: string;
  logoText?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  colors?: Partial<Record<ThemeToken, string>>;
  fontDisplay?: string;
  fontSans?: string;
  fontLinkHref?: string;
  heroTitle?: string;
  heroBody?: string;
  intakeNote?: string;
  agentNames?: Record<string, string>;
};

export type ThemeToken =
  | "background"
  | "foreground"
  | "card"
  | "primary"
  | "primary-foreground"
  | "muted-foreground"
  | "border"
  | "ember"
  | "ember-soft"
  | "ember-deep"
  | "ink"
  | "parchment"
  | "linen";

export const THEME_TOKENS: { key: ThemeToken; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "card", label: "Card surface" },
  { key: "primary", label: "Primary" },
  { key: "primary-foreground", label: "On primary" },
  { key: "muted-foreground", label: "Muted text" },
  { key: "border", label: "Border" },
  { key: "ember", label: "Accent" },
  { key: "ember-soft", label: "Accent soft" },
  { key: "ember-deep", label: "Accent deep" },
  { key: "ink", label: "Ink" },
  { key: "parchment", label: "Parchment" },
  { key: "linen", label: "Linen" },
];

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  is_default: boolean;
  branding: TenantBranding;
  email_from_name: string | null;
  email_from_address: string | null;
};

export const DEFAULT_TENANT: Tenant = {
  id: "",
  slug: "clarity360",
  name: "Clarity 360",
  status: "active",
  is_default: true,
  branding: {},
  email_from_name: null,
  email_from_address: null,
};

export const TENANT_COOKIE = "c360_tenant";

export const TenantContext = createContext<Tenant>(DEFAULT_TENANT);

export function useTenant(): Tenant {
  return useContext(TenantContext);
}

export function brandName(tenant: Tenant): string {
  return tenant.branding.productName?.trim() || tenant.name || DEFAULT_TENANT.name;
}

/** Splits a wordmark into a lead word and an accented tail ("Clarity" + "360"). */
export function brandWordmark(tenant: Tenant): { lead: string; tail: string } {
  const text = tenant.branding.logoText?.trim() || brandName(tenant);
  const parts = text.split(/\s+/);
  if (parts.length === 1) return { lead: parts[0]!, tail: "" };
  return { lead: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1]! };
}

export function brandInitial(tenant: Tenant): string {
  return brandWordmark(tenant).lead.charAt(0).toUpperCase() || "C";
}

export function agentName(tenant: Tenant, key: string): string {
  return tenant.branding.agentNames?.[key]?.trim() || AGENT_NAMES[key] || key;
}

/** CSS custom-property overrides for this tenant, injected as a <style> tag. */
export function brandingCss(tenant: Tenant): string {
  const b = tenant.branding;
  const lines: string[] = [];
  for (const [token, value] of Object.entries(b.colors ?? {})) {
    if (value && String(value).trim()) lines.push(`--${token}: ${value};`);
  }
  if (b.fontDisplay?.trim()) lines.push(`--font-display: ${b.fontDisplay};`);
  if (b.fontSans?.trim()) lines.push(`--font-sans: ${b.fontSans};`);
  if (!lines.length) return "";
  return `:root{${lines.join("")}}`;
}

