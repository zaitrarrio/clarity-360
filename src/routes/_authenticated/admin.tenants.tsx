import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/clarity/AppHeader";
import { createTenant, listTenants, setTenantStatus } from "@/lib/tenant.functions";

export const Route = createFileRoute("/_authenticated/admin/tenants")({
  head: () => ({
    meta: [
      { title: "Workspaces — platform administration" },
      { name: "description", content: "Create and manage white-label workspaces, their slugs, hosts and status." },
      { property: "og:title", content: "Workspaces — platform administration" },
      { property: "og:description", content: "Create and manage white-label workspaces, their slugs, hosts and status." },
    ],
  }),
  component: TenantsAdmin,
});

const field =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-ember/60";
const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground";

function TenantsAdmin() {
  const list = useServerFn(listTenants);
  const create = useServerFn(createTenant);
  const status = useServerFn(setTenantStatus);
  const qc = useQueryClient();

  const tenants = useQuery({ queryKey: ["tenants"], queryFn: () => list({}), retry: false });

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const add = useMutation({
    mutationFn: () =>
      create({
        data: {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          ...(host.trim() ? { host: host.trim() } : {}),
          ...(ownerEmail.trim() ? { ownerEmail: ownerEmail.trim() } : {}),
        },
      }),
    onSuccess: () => {
      setSlug("");
      setName("");
      setHost("");
      setOwnerEmail("");
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const toggle = useMutation({
    mutationFn: (v: { tenantId: string; status: "active" | "suspended" }) => status({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-5 py-10 md:px-7">
        <p className={label}>Platform</p>
        <h1 className="mt-2 font-display text-[34px] font-medium tracking-tight text-balance text-foreground">
          Workspaces
        </h1>

        {tenants.error ? (
          <p className="mt-8 text-[13px] text-muted-foreground">{(tenants.error as Error).message}</p>
        ) : (
          <>
            <div className="mt-8 space-y-2">
              {(tenants.data ?? []).map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card/70 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] text-foreground">
                        {t.name}
                        {t.is_default ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ember">
                            default
                          </span>
                        ) : null}
                      </p>
                      <p className="font-mono text-[11.5px] text-muted-foreground">
                        /t/{t.slug}
                        {t.domains.length ? ` · ${t.domains.map((d) => d.host).join(", ")}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        toggle.mutate({ tenantId: t.id, status: t.status === "active" ? "suspended" : "active" })
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
                    >
                      {t.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <section className="mt-8 rounded-2xl border border-border bg-card/70 p-5">
              <h2 className="font-display text-[20px] text-foreground">New workspace</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={label}>Slug</p>
                  <input className={`${field} mt-1.5`} value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
                <div>
                  <p className={label}>Name</p>
                  <input className={`${field} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <p className={label}>Host (optional)</p>
                  <input className={`${field} mt-1.5`} value={host} onChange={(e) => setHost(e.target.value)} />
                </div>
                <div>
                  <p className={label}>Owner email (optional)</p>
                  <input
                    className={`${field} mt-1.5`}
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => add.mutate()}
                disabled={!slug.trim() || !name.trim() || add.isPending}
                className="mt-4 rounded-full bg-ember-soft px-5 py-2 text-[13px] font-semibold text-ink shadow-ember hover:bg-ember hover:text-primary-foreground disabled:opacity-50"
              >
                {add.isPending ? "Creating…" : "Create workspace"}
              </button>
              {add.error ? <p className="mt-2 text-[12.5px] text-destructive">{(add.error as Error).message}</p> : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
