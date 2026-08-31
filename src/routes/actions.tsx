import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppHeader } from "@/components/clarity/AppHeader";
import { Markdown } from "@/components/clarity/Markdown";
import { runAction, scheduleAction } from "@/lib/clarity.functions";
import { AGENT_NAMES, DOMAINS, timeAgo, timeUntil, type ActionDef } from "@/lib/clarity";
import { useActions, useActiveBusinessId, useBusiness, useRuns, useSchedules } from "@/lib/useWorkspace";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Actions & agents — Clarity 360" },
      {
        name: "description",
        content:
          "Run the plan: generate a pitch deck, build the site, post today, or hand a recurring watch to a domain agent.",
      },
      { property: "og:title", content: "Actions & agents — Clarity 360" },
      { property: "og:description", content: "Every part of the plan is something an agent can actually do." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActionsPage,
});

const CADENCES = [
  { key: "on_demand", label: "On-demand" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

function ActionsPage() {
  const businessId = useActiveBusinessId();
  const qc = useQueryClient();
  const { data: business } = useBusiness(businessId);
  const { data: actions } = useActions(businessId);
  const { data: runs } = useRuns(businessId);
  const { data: schedules } = useSchedules(businessId);

  const run = useServerFn(runAction);
  const schedule = useServerFn(scheduleAction);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["runs", businessId] });
    qc.invalidateQueries({ queryKey: ["schedules", businessId] });
    qc.invalidateQueries({ queryKey: ["signals", businessId] });
  }

  async function onRun(action: ActionDef) {
    setBusyKey(action.action_key);
    setError(null);
    try {
      const result = await run({ data: { businessId, actionKey: action.action_key } });
      refresh();
      setOpenRun(result.runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That action failed.");
    } finally {
      setBusyKey(null);
    }
  }

  const grouped = DOMAINS.map((d) => ({
    domain: d,
    items: (actions ?? []).filter((a) => a.domain_key === d.key),
  })).filter((g) => g.items.length);

  const openRunRow = (runs ?? []).find((r) => r.id === openRun);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader businessName={business?.name} />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-7 md:px-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">
          <h1 className="font-display text-[38px] leading-tight font-normal tracking-tight text-foreground">
            Actions
          </h1>
          <p className="mt-2 max-w-2xl text-[14.5px] font-light text-muted-foreground">
            Run something once, or hand it to its agent on a cadence. Results land here and on your agenda.
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-8 space-y-9">
            {grouped.map(({ domain, items }) => (
              <section key={domain.key}>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[10px] text-ember">{domain.n}</span>
                  <h2 className="font-display text-[20px] font-normal text-foreground">{domain.label}</h2>
                  <span className="text-[11.5px] font-light text-muted-foreground">agent {domain.agent}</span>
                </div>
                <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                  {items.map((a) => {
                    const sched = (schedules ?? []).find((s) => s.action_key === a.action_key);
                    const last = (runs ?? []).find((r) => r.action_key === a.action_key);
                    return (
                      <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14.5px] font-medium text-foreground">{a.title}</div>
                            <div className="mt-1 text-[12px] font-light text-muted-foreground">
                              {a.kind === "recurring" ? "Recurring" : "One-shot"} ·{" "}
                              {AGENT_NAMES[a.agent_key ?? ""] ?? "Clara"}
                              {last ? ` · last run ${timeAgo(last.started_at)}` : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => onRun(a)}
                            disabled={busyKey === a.action_key}
                            className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-background disabled:opacity-50"
                          >
                            {busyKey === a.action_key ? "Running…" : "Run now"}
                          </button>
                        </div>

                        <div className="mt-3 border-t border-border pt-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {CADENCES.map((c) => {
                              const current = sched?.active ? sched.cadence : "on_demand";
                              const selected = current === c.key;
                              return (
                                <button
                                  key={c.key}
                                  onClick={async () => {
                                    setBusyKey(`${a.action_key}:sched`);
                                    try {
                                      await schedule({
                                        data: { businessId, actionKey: a.action_key, cadence: c.key },
                                      });
                                      refresh();
                                    } finally {
                                      setBusyKey(null);
                                    }
                                  }}
                                  className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                                    selected
                                      ? "border-ember bg-ember/10 font-medium text-foreground"
                                      : "border-border font-light text-muted-foreground hover:border-ember/40 hover:text-foreground"
                                  }`}
                                >
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-2 text-[11.5px] font-light text-muted-foreground">
                            {sched?.active
                              ? `Runs ${sched.cadence}, next ${timeUntil(sched.next_run_at)}`
                              : "Runs only when you ask"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>

        <aside className="min-w-0">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Recent output
          </div>
          <div className="space-y-2">
            {(runs ?? []).slice(0, 12).map((r) => (
              <button
                key={r.id}
                onClick={() => setOpenRun(openRun === r.id ? null : r.id)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-left"
              >
                <div className="text-[13.5px] font-medium text-foreground">{r.artifact_title ?? r.title}</div>
                <div className="mt-0.5 text-[11.5px] font-light text-muted-foreground">
                  {AGENT_NAMES[r.agent_key ?? ""] ?? "Clara"} · {r.status} · {timeAgo(r.started_at)}
                </div>
              </button>
            ))}
            {!runs?.length ? (
              <p className="text-[13px] font-light text-muted-foreground">Nothing has run yet.</p>
            ) : null}
          </div>
        </aside>
      </div>

      {openRunRow?.artifact_body ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setOpenRun(null)}
        >
          <div
            className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="font-display text-[26px] leading-tight font-normal text-foreground">
                {openRunRow.artifact_title ?? openRunRow.title}
              </h2>
              <button
                onClick={() => setOpenRun(null)}
                className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted-foreground"
              >
                Close
              </button>
            </div>
            <Markdown>{openRunRow.artifact_body}</Markdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}
