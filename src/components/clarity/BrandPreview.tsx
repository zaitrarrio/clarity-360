import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { AGENT_NAMES } from "@/lib/clarity";
import { THEME_TOKENS, type TenantBranding } from "@/lib/tenant";

const DEFAULT_DISPLAY = '"Cormorant Garamond", Georgia, serif';
const DEFAULT_SANS = '"DM Sans", system-ui, sans-serif';
const DEFAULT_HERO_TITLE = "From an idea to a growing business.";
const DEFAULT_HERO_BODY =
  "A living seven-domain operating plan, held by a central agent and worked by agents that run actions and watch for change.";

function wordmark(text: string): { lead: string; tail: string } {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { lead: "Clarity", tail: "360" };
  if (parts.length === 1) return { lead: parts[0]!, tail: "" };
  return { lead: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1]! };
}

/** Live, unsaved preview of a workspace's branding. */
export function BrandPreview({ name, branding }: { name: string; branding: TenantBranding }) {
  const productName = branding.productName?.trim() || name.trim() || "Clarity 360";
  const { lead, tail } = wordmark(branding.logoText?.trim() || productName);
  const display = branding.fontDisplay?.trim() || DEFAULT_DISPLAY;
  const sans = branding.fontSans?.trim() || DEFAULT_SANS;

  const fontHref = branding.fontLinkHref?.trim();
  useEffect(() => {
    if (!fontHref || !/^https:\/\//.test(fontHref)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    link.dataset["brandPreview"] = "1";
    document.head.appendChild(link);
    return () => link.remove();
  }, [fontHref]);

  const style = useMemo(() => {
    const s: Record<string, string> = {};
    for (const t of THEME_TOKENS) {
      const v = branding.colors?.[t.key]?.trim();
      if (v) s[`--${t.key}`] = v;
    }
    s["backgroundColor"] = "var(--background)";
    s["color"] = "var(--foreground)";
    s["fontFamily"] = sans;
    return s as CSSProperties;
  }, [branding.colors, sans]);

  const agents = Object.entries(AGENT_NAMES).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-border" style={style}>
      {/* header */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        {branding.logoUrl?.trim() ? (
          <img src={branding.logoUrl} alt="" className="h-[22px] w-auto" />
        ) : (
          <div
            className="grid h-[22px] w-[22px] place-items-center rounded-[7px] text-[13px] font-semibold"
            style={{ background: "var(--ink)", color: "var(--ember-soft)", fontFamily: display }}
          >
            {lead.charAt(0).toUpperCase() || "C"}
          </div>
        )}
        <span className="text-[17px] font-medium tracking-tight" style={{ fontFamily: display }}>
          {lead} {tail ? <span style={{ color: "var(--ember)" }}>{tail}</span> : null}
        </span>
        <span className="flex-1" />
        <span
          className="rounded-full px-3 py-1 text-[11.5px] font-semibold"
          style={{ background: "var(--ember-soft)", color: "var(--ink)" }}
        >
          Build a plan
        </span>
      </div>

      {/* hero */}
      <div className="px-5 py-6">
        <p
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
        >
          {productName}
        </p>
        <h3
          className="mt-2 text-[26px] font-medium tracking-tight text-balance"
          style={{ fontFamily: display }}
        >
          {branding.heroTitle?.trim() || DEFAULT_HERO_TITLE}
        </h3>
        <p className="mt-2 text-[13px] font-light text-pretty" style={{ color: "var(--muted-foreground)" }}>
          {branding.heroBody?.trim() || DEFAULT_HERO_BODY}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {agents.map(([key, fallback]) => (
            <div
              key={key}
              className="rounded-xl border px-3 py-2.5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <p className="text-[13px] font-medium" style={{ fontFamily: display }}>
                {branding.agentNames?.[key]?.trim() || fallback}
              </p>
              <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                {key}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="border-t px-5 py-3 text-[11.5px]"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        {branding.footerText?.trim() || `© ${new Date().getFullYear()} ${productName}`}
      </div>
    </div>
  );
}
