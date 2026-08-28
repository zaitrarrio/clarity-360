import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/clarity/AppHeader";
import { Clara } from "@/components/clarity/Clara";
import { DOMAINS, type PlanSection } from "@/lib/clarity";
import { useActiveBusinessId, useBusiness, usePlanSections } from "@/lib/useWorkspace";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "The operating plan — Clarity 360" },
      {
        name: "description",
        content:
          "Seven linked reports — market, offer, growth, operations, finance, brand, risk — held live by Clara and turned into actions you can run.",
      },
      { property: "og:title", content: "The operating plan — Clarity 360" },
      {
        property: "og:description",
        content: "A living seven-domain operating plan with an agent on every domain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

function SectionBody({ section }: { section: PlanSection }) {
  return (
    <div className="space-y-8">
      {section.summary ? (
        <p className="max-w-3xl text-pretty font-display text-[21px] leading-[1.5] font-light text-foreground">
          {section.summary}
        </p>
      ) : null}

      {section.metrics?.length ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {section.metrics.map((m, i) => (
            <div key={i} className="bg-card px-4 py-4">
              <div className="text-balance font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{m.label}</div>
              <div className="mt-1.5 text-balance font-display text-[26px] leading-none font-normal text-foreground">{m.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {section.findings?.length ? (
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">What we found</h3>
          <ul className="mt-3 space-y-3">
            {section.findings.map((f, i) => (
              <li key={i} className="flex gap-3 border-b border-border/70 pb-3 text-[14.5px] leading-relaxed font-light text-foreground/85">
                <span className="mt-[3px] font-mono text-[10px] text-ember">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-pretty">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.decisions?.length ? (
        <div className="rounded-xl border border-ember/25 bg-ember/[0.06] p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Decisions</h3>
          <ul className="mt-3 space-y-2.5">
            {section.decisions.map((d, i) => (
              <li key={i} className="text-pretty text-[14.5px] leading-relaxed font-light text-foreground">
                {d}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PlanPage() {
  const businessId = useActiveBusinessId();
  const { data: business } = useBusiness(businessId);
  const { data: sections, isLoading } = usePlanSections(businessId);
  const [active, setActive] = useState<string>("market");

  const current = sections?.find((s) => s.domain_key === active);
  const meta = DOMAINS.find((d) => d.key === active);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader businessName={business?.name} />
      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-7 md:px-7 xl:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-[76px] xl:self-start">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reports</div>
          <nav className="flex gap-1.5 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            {DOMAINS.map((d) => {
              const on = d.key === active;
              return (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors xl:w-full ${
                    on
                      ? "border-ember/40 bg-ember/10 font-medium text-foreground"
                      : "border-transparent font-light text-muted-foreground hover:bg-parchment hover:text-foreground"
                  }`}
                >
                  <span className={`font-mono text-[9.5px] ${on ? "text-ember" : "text-muted-foreground/60"}`}>{d.n}</span>
                  <span className="whitespace-nowrap">{d.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              Report {meta?.n} · agent {meta?.agent}
            </div>
            <h1 className="mt-2 text-balance font-display text-[38px] leading-[1.08] font-normal tracking-tight text-foreground">
              {current?.title ?? meta?.label}
            </h1>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-parchment" />
              ))}
            </div>
          ) : current ? (
            <SectionBody section={current} />
          ) : (
            <p className="text-[14px] font-light text-muted-foreground">
              This report hasn't been written yet. Ask Clara to fill it in.
            </p>
          )}
          <aside className="mt-8 xl:hidden">
            <Clara businessId={businessId} section={meta?.label ?? null} compact />
          </aside>
        </main>
      </div>

      <aside className="fixed bottom-6 right-6 z-40 hidden h-[calc(100vh-100px)] w-[380px] xl:flex">
        <Clara businessId={businessId} section={meta?.label ?? null} />
      </aside>
    </div>
  );
}
