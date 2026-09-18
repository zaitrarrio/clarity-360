import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Circle, HandHelping, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/clarity/Markdown";
import { WorkspaceShell } from "@/components/clarity/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { getTodayBriefing, regenerateBriefing } from "@/lib/briefing.functions";
import { getReadiness, setReadinessStatus } from "@/lib/readiness.functions";
import type { ReadinessItem, ReadinessStatus } from "@/lib/readiness";
import { useActiveBusinessId, useBusiness } from "@/lib/useWorkspace";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "My Briefing — Clarity 360" },
      {
        name: "description",
        content: "Clara's daily, plan-grounded read on what actually moves the business forward today.",
      },
      { property: "og:title", content: "My Briefing — Clarity 360" },
      { property: "og:description", content: "One focused briefing a day, tied straight to your readiness checklist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BriefingPage,
});

const STATUS: { value: ReadinessStatus; label: string; icon: typeof Circle }[] = [
  { value: "not_started", label: "Not started", icon: Circle },
  { value: "needs_help", label: "Need help", icon: HandHelping },
  { value: "complete", label: "Done", icon: Check },
];

function BriefingPage() {
  const businessId = useActiveBusinessId();
  const { data: business } = useBusiness(businessId);
  const qc = useQueryClient();

  const fetchBriefing = useServerFn(getTodayBriefing);
  const regenerate = useServerFn(regenerateBriefing);
  const fetchReadiness = useServerFn(getReadiness);
  const saveStatus = useServerFn(setReadinessStatus);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: briefing, isLoading } = useQuery({
    queryKey: ["briefing", businessId],
    queryFn: () => fetchBriefing({ data: { businessId } }),
    enabled: Boolean(business?.user_id),
    staleTime: 5 * 60_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["readiness", businessId],
    queryFn: () => fetchReadiness({ data: { businessId } }),
    enabled: Boolean(business?.user_id),
  });

  const focusItems = (briefing?.focus_item_keys ?? [])
    .map((key) => items.find((i) => i.item_key === key))
    .filter((i): i is ReadinessItem => Boolean(i));

  async function refresh() {
    setBusy("regenerate");
    setError(null);
    try {
      await regenerate({ data: { businessId } });
      await qc.invalidateQueries({ queryKey: ["briefing", businessId] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not regenerate today's briefing.");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(item: ReadinessItem, status: ReadinessStatus) {
    setBusy(item.item_key);
    setError(null);
    try {
      await saveStatus({ data: { businessId, itemKey: item.item_key, status } });
      await qc.invalidateQueries({ queryKey: ["readiness", businessId] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Progress could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspaceShell businessName={business?.name}>
      <main className="mx-auto w-full max-w-3xl px-5 py-7 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="mt-2 text-balance font-display text-[38px] leading-tight font-normal text-foreground">
              My Briefing
            </h1>
          </div>
          <Button size="sm" variant="outline" disabled={busy === "regenerate"} onClick={refresh}>
            <RefreshCw className={busy === "regenerate" ? "animate-spin" : ""} />
            {busy === "regenerate" ? "Thinking…" : "Refresh"}
          </Button>
        </div>

        {error ? (
          <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="py-12 text-[13px] text-muted-foreground">Clara is putting today's briefing together…</p>
        ) : briefing ? (
          <article className="mt-7 rounded-xl border border-border bg-card p-6">
            <h2 className="text-balance font-display text-[24px] leading-snug font-normal text-foreground">
              {briefing.headline}
            </h2>
            <div className="mt-3">
              <Markdown>{briefing.body}</Markdown>
            </div>
          </article>
        ) : null}

        {focusItems.length ? (
          <div className="mt-8">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Today's focus
            </h3>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {focusItems.map((item) => (
                <div key={item.item_key} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.status === "complete" ? (
                        <Check className="h-4 w-4 text-ember" />
                      ) : item.status === "needs_help" ? (
                        <HandHelping className="h-4 w-4 text-ember" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h4 className="text-[14.5px] font-medium text-foreground">{item.title}</h4>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 max-w-xl text-pretty text-[13px] font-light leading-relaxed text-muted-foreground">
                      {item.objective ?? item.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 rounded-md border border-border bg-background p-0.5">
                    {STATUS.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={item.status === option.value ? "secondary" : "ghost"}
                        disabled={busy === item.item_key}
                        onClick={() => void setStatus(item, option.value)}
                        className="h-7 px-2.5"
                      >
                        <option.icon />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/actions">
              <Sparkles />
              Open My Actions
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/agenda">See everything on the agenda</Link>
          </Button>
        </div>
      </main>
    </WorkspaceShell>
  );
}
