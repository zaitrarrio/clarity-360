import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, Circle, HandHelping, Sparkles } from "lucide-react";
import { useState } from "react";
import { WorkspaceShell } from "@/components/clarity/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getReadiness, setReadinessStatus } from "@/lib/readiness.functions";
import type { ReadinessItem, ReadinessStatus } from "@/lib/readiness";
import { useActiveBusinessId, useBusiness } from "@/lib/useWorkspace";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "My Actions — Clarity 360" },
      { name: "description", content: "See what your business has completed, what it still needs, and where Clarity 360 can help." },
      { property: "og:title", content: "My Actions — Clarity 360" },
      { property: "og:description", content: "A practical, stage-aware readiness checklist for your business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActionsPage,
});

const STATUS: { value: ReadinessStatus; label: string; icon: typeof Circle }[] = [
  { value: "not_started", label: "Not started", icon: Circle },
  { value: "needs_help", label: "Need help", icon: HandHelping },
  { value: "complete", label: "Done", icon: Check },
];

function HelpAction({ item }: { item: ReadinessItem }) {
  if (item.help_kind === "agent" && item.help_target) {
    return <Button asChild size="sm" variant="outline"><Link to="/agents"><Bot />Open My Agents</Link></Button>;
  }
  if (item.help_kind === "integration") {
    const name = item.help_target === "bizee" ? "Bizee" : item.help_target === "stripe" ? "Stripe" : "service";
    return <Button size="sm" variant="outline" disabled title={`${name} fulfillment can be enabled when its skill is connected.`}><Sparkles />Connect {name}</Button>;
  }
  return <Button asChild size="sm" variant="outline"><Link to="/plan"><Sparkles />Ask Clara</Link></Button>;
}

function ActionsPage() {
  const businessId = useActiveBusinessId();
  const { data: business } = useBusiness(businessId);
  const fetchReadiness = useServerFn(getReadiness);
  const saveStatus = useServerFn(setReadinessStatus);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["readiness", businessId],
    queryFn: () => fetchReadiness({ data: { businessId } }),
    enabled: Boolean(business?.user_id),
  });

  const complete = items.filter((item) => item.status === "complete").length;
  const progress = items.length ? Math.round((complete / items.length) * 100) : 0;
  const categories = Array.from(new Set(items.map((item) => item.category)));

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
      <main className="mx-auto w-full max-w-6xl px-5 py-7 md:px-7">
        <div className="grid gap-6 border-b border-border pb-7 md:grid-cols-[minmax(0,1fr)_300px] md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Business readiness</p>
            <h1 className="mt-2 text-balance font-display text-[38px] leading-tight font-normal text-foreground">My Actions</h1>
            <p className="mt-2 max-w-2xl text-pretty text-[14.5px] font-light leading-relaxed text-muted-foreground">
              What {business?.name ?? "your business"} has handled, what comes next, and where you want help.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[12px] text-muted-foreground">Overall readiness</span>
              <strong className="font-display text-[28px] font-normal text-foreground">{progress}%</strong>
            </div>
            <Progress value={progress} className="mt-3" />
            <p className="mt-2 text-[11.5px] text-muted-foreground">{complete} of {items.length} must-haves complete</p>
          </div>
        </div>

        {error ? <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p> : null}
        {isLoading ? <p className="py-12 text-[13px] text-muted-foreground">Building your business checklist…</p> : null}

        <div className="mt-8 space-y-10">
          {categories.map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            const categoryDone = categoryItems.filter((item) => item.status === "complete").length;
            return (
              <section key={category}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                  <h2 className="font-display text-[22px] font-normal text-foreground">{category}</h2>
                  <span className="font-mono text-[10px] text-muted-foreground">{categoryDone}/{categoryItems.length} complete</span>
                </div>
                <div className="divide-y divide-border">
                  {categoryItems.map((item) => (
                    <div key={item.item_key} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {item.status === "complete" ? <Check className="h-4 w-4 text-ember" /> : item.status === "needs_help" ? <HandHelping className="h-4 w-4 text-ember" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                          <h3 className="text-balance text-[15px] font-medium text-foreground">{item.title}</h3>
                        </div>
                        <p className="mt-1.5 max-w-2xl text-pretty text-[13px] font-light leading-relaxed text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-md border border-border bg-background p-0.5">
                          {STATUS.map((option) => (
                            <Button
                              key={option.value}
                              size="sm"
                              variant={item.status === option.value ? "secondary" : "ghost"}
                              disabled={busy === item.item_key}
                              onClick={() => void setStatus(item, option.value)}
                              className="h-7 px-2.5"
                            >
                              <option.icon />{option.label}
                            </Button>
                          ))}
                        </div>
                        {item.status !== "complete" ? <HelpAction item={item} /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </WorkspaceShell>
  );
}