import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/clarity/AppHeader";
import { BrandPreview } from "@/components/clarity/BrandPreview";
import { AGENT_NAMES } from "@/lib/clarity";
import { THEME_TOKENS, type TenantBranding } from "@/lib/tenant";
import {
  addTenantDomain,
  addTenantMember,
  listTenantMembers,
  myTenantRole,
  removeTenantMember,
  updateTenantBranding,
} from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/settings/branding")({
  head: () => ({
    meta: [
      { title: "Workspace branding — white-label settings" },
      { name: "description", content: "Rename the product, set colours, fonts, logo and agent names for your workspace." },
      { property: "og:title", content: "Workspace branding — white-label settings" },
      { property: "og:description", content: "Rename the product, set colours, fonts, logo and agent names for your workspace." },
    ],
  }),
  component: BrandingSettings,
});

const field =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-ember/60";
const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground";
const card = "rounded-2xl border border-border bg-card/70 p-5";

function BrandingSettings() {
  const role = useServerFn(myTenantRole);
  const save = useServerFn(updateTenantBranding);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["my-tenant-role"], queryFn: () => role({}) });

  const [name, setName] = useState("");
  const [branding, setBranding] = useState<TenantBranding>({});
  const [fromName, setFromName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.tenant) return;
    setName(data.tenant.name);
    setBranding(data.tenant.branding ?? {});
    setFromName(data.tenant.email_from_name ?? "");
    setFromAddress(data.tenant.email_from_address ?? "");
  }, [data?.tenant]);

  const canEdit = data?.role === "owner" || data?.role === "admin" || data?.platformAdmin;

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          tenantId: data!.tenant.id,
          name,
          branding,
          emailFromName: fromName.trim() || null,
          emailFromAddress: fromAddress.trim() || null,
        },
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["my-tenant-role"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const set = (patch: Partial<TenantBranding>) => setBranding((b) => ({ ...b, ...patch }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 md:px-7">
        <p className={label}>Workspace</p>
        <h1 className="mt-2 font-display text-[34px] font-medium tracking-tight text-balance text-foreground">
          Branding
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] font-light text-pretty text-muted-foreground">
          Everything here is scoped to this workspace only. Visitors arriving on your own domain — or through your
          workspace link — see these names, colours and fonts instead of the defaults.
        </p>

        {isLoading ? (
          <p className="mt-8 text-[13px] text-muted-foreground">Loading…</p>
        ) : !canEdit ? (
          <p className="mt-8 text-[13px] text-muted-foreground">
            You need to be an owner or admin of this workspace to change its branding.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-5">
            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Identity</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={label}>Workspace name</p>
                  <input className={`${field} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <p className={label}>Product name</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.productName ?? ""}
                    onChange={(e) => set({ productName: e.target.value })}
                    placeholder={name}
                  />
                </div>
                <div>
                  <p className={label}>Wordmark</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.logoText ?? ""}
                    onChange={(e) => set({ logoText: e.target.value })}
                    placeholder="Clarity 360"
                  />
                  <p className="mt-1 text-[11.5px] text-muted-foreground">Last word is shown in the accent colour.</p>
                </div>
                <div>
                  <p className={label}>Logo image URL</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.logoUrl ?? ""}
                    onChange={(e) => set({ logoUrl: e.target.value })}
                    placeholder="https://…/logo.svg"
                  />
                </div>
                <div>
                  <p className={label}>Favicon URL</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.faviconUrl ?? ""}
                    onChange={(e) => set({ faviconUrl: e.target.value })}
                  />
                </div>
                <div>
                  <p className={label}>Footer line</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.footerText ?? ""}
                    onChange={(e) => set({ footerText: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Palette</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Any CSS colour value. Leave blank to keep the default.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {THEME_TOKENS.map((t) => (
                  <div key={t.key}>
                    <p className={label}>{t.label}</p>
                    <input
                      className={`${field} mt-1.5 font-mono text-[12px]`}
                      value={branding.colors?.[t.key] ?? ""}
                      onChange={(e) => set({ colors: { ...(branding.colors ?? {}), [t.key]: e.target.value } })}
                      placeholder="oklch(…) / #hex"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Type</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={label}>Display font stack</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.fontDisplay ?? ""}
                    onChange={(e) => set({ fontDisplay: e.target.value })}
                    placeholder='"Playfair Display", serif'
                  />
                </div>
                <div>
                  <p className={label}>Body font stack</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.fontSans ?? ""}
                    onChange={(e) => set({ fontSans: e.target.value })}
                    placeholder='"Inter", sans-serif'
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className={label}>Webfont stylesheet URL</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.fontLinkHref ?? ""}
                    onChange={(e) => set({ fontLinkHref: e.target.value })}
                    placeholder="https://fonts.googleapis.com/css2?family=…"
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Voice</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className={label}>Landing headline</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={branding.heroTitle ?? ""}
                    onChange={(e) => set({ heroTitle: e.target.value })}
                  />
                </div>
                <div>
                  <p className={label}>Landing paragraph</p>
                  <textarea
                    className={`${field} mt-1.5 min-h-[80px]`}
                    value={branding.heroBody ?? ""}
                    onChange={(e) => set({ heroBody: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Agent names</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(AGENT_NAMES).map(([key, fallback]) => (
                  <div key={key}>
                    <p className={label}>{key}</p>
                    <input
                      className={`${field} mt-1.5`}
                      value={branding.agentNames?.[key] ?? ""}
                      placeholder={fallback}
                      onChange={(e) => set({ agentNames: { ...(branding.agentNames ?? {}), [key]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className={card}>
              <h2 className="font-display text-[20px] text-foreground">Sender identity</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={label}>From name</p>
                  <input className={`${field} mt-1.5`} value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
                <div>
                  <p className={label}>From address</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <DomainsAndMembers tenantId={data!.tenant.id} />

            <div className="flex items-center gap-3">
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="rounded-full bg-ember-soft px-5 py-2 text-[13px] font-semibold text-on-ember shadow-ember hover:bg-ember hover:text-on-ember disabled:opacity-50"
              >
                {mutation.isPending ? "Saving…" : "Save branding"}
              </button>
              {saved ? <span className="text-[12.5px] text-muted-foreground">Saved — reload to see it applied.</span> : null}
              {mutation.error ? (
                <span className="text-[12.5px] text-destructive">{(mutation.error as Error).message}</span>
              ) : null}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <p className={label}>Live preview</p>
              <span className="text-[11.5px] text-muted-foreground">unsaved changes shown</span>
            </div>
            <div className="mt-2">
              <BrandPreview name={name} branding={branding} />
            </div>
          </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function DomainsAndMembers({ tenantId }: { tenantId: string }) {
  const list = useServerFn(listTenantMembers);
  const add = useServerFn(addTenantMember);
  const remove = useServerFn(removeTenantMember);
  const domain = useServerFn(addTenantDomain);
  const qc = useQueryClient();

  const members = useQuery({ queryKey: ["tenant-members", tenantId], queryFn: () => list({ data: { tenantId } }) });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member">("member");
  const [host, setHost] = useState("");

  const invite = useMutation({
    mutationFn: () => add({ data: { tenantId, email, role } }),
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["tenant-members", tenantId] });
    },
  });
  const drop = useMutation({
    mutationFn: (memberId: string) => remove({ data: { tenantId, memberId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant-members", tenantId] }),
  });
  const attach = useMutation({
    mutationFn: () => domain({ data: { tenantId, host } }),
    onSuccess: () => setHost(""),
  });

  return (
    <>
      <section className={card}>
        <h2 className="font-display text-[20px] text-foreground">Domain</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Point a hostname at this workspace. Visitors on that host get this branding automatically.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className={`${field} sm:max-w-xs`}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="plans.youragency.com"
          />
          <button
            onClick={() => attach.mutate()}
            disabled={!host.trim() || attach.isPending}
            className="rounded-full border border-ember/40 bg-ember/10 px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-50"
          >
            Add host
          </button>
        </div>
        {attach.error ? (
          <p className="mt-2 text-[12.5px] text-destructive">{(attach.error as Error).message}</p>
        ) : null}
      </section>

      <section className={card}>
        <h2 className="font-display text-[20px] text-foreground">People</h2>
        <div className="mt-4 space-y-2">
          {(members.data ?? []).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[13px]"
            >
              <span className="text-foreground">{m.email}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {m.role}
                </span>
                <button
                  onClick={() => drop.mutate(m.id)}
                  className="text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className={`${field} sm:max-w-xs`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@company.com"
          />
          <select className={`${field} sm:max-w-[140px]`} value={role} onChange={(e) => setRole(e.target.value as never)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button
            onClick={() => invite.mutate()}
            disabled={!email.trim() || invite.isPending}
            className="rounded-full border border-ember/40 bg-ember/10 px-4 py-2 text-[13px] font-medium text-foreground disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {invite.error ? <p className="mt-2 text-[12.5px] text-destructive">{(invite.error as Error).message}</p> : null}
      </section>
    </>
  );
}
