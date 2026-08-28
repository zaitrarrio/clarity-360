import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/clarity/AppHeader";
import { Clara } from "@/components/clarity/Clara";
import { runAction, setSignalStatus } from "@/lib/clarity.functions";
import { AGENT_NAMES, timeAgo, timeUntil } from "@/lib/clarity";
import {
  useActions,
  useActiveBusinessId,
  useAgents,
  useBusiness,
  useRuns,
  useSchedules,
  useSignals,
} from "@/lib/useWorkspace";
import { useState } from "react";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Today's agenda — Clarity 360" },
      {
        name: "description",
        content:
          "What changed while you were away: agent signals, price alerts, upcoming runs, and the two or three moves that matter today.",
      },
      { property: "og:title", content: "Today's agenda — Clarity 360" },
      { property: "og:description", content: "Proactive signals from the agents working your plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendaPage,
});

const SEVERITY: Record<string, string> = {
  alert: "border-destructive/40 bg-destructive/[0.06]",
  warning: "border-ember/40 bg-ember/[0.07]",
  info: "border-border bg-card",
};

function AgendaPage() {
  const businessId = useActiveBusinessId();
  const qc = useQueryClient();
  const { data: business } = useBusiness(businessId);
  const { data: signals } = useSignals(businessId);
  const { data: schedules } = useSchedules(businessId);
  const { data: agents } = useAgents(businessId);
  const { data: actions } = useActions(businessId);
  const { data: runs } = useRuns(businessId);
  const setStatus = useServerFn(setSignalStatus);
  const run = useServerFn(runAction);
  const [busy, setBusy] = useState<string | null>(null);

  const open = (signals ?? []).filter((s) => s.status !== "dismissed");

  function refresh() {
    qc.invalidateQueries({ queryKey: ["signals", businessId] });
    qc.invalidateQueries({ queryKey: ["runs", businessId] });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader businessName={business?.name} />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-7 md:px-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="mt-2 font-display text-[38px] leading-tight font-normal tracking-tight text-foreground">
            What needs you today
          </h1>

          <div className="mt-7 space-y-3">
            {open.map((s) => {
              const suggested = (actions ?? []).find((a) => a.action_key === s.suggested_action_key);
              return (
                <article key={s.id} className={`rounded-xl border p-4 ${SEVERITY[s.severity] ?? SEVERITY["info"]}`}>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span className={s.severity === "info" ? "text-muted-foreground" : "text-ember"}>{s.severity}</span>
                    <span>·</span>
                    <span>{AGENT_NAMES[s.agent_key ?? ""] ?? "Clara"}</span>
                    <span>·</span>
                    <span>{timeAgo(s.created_at)}</span>
                  </div>
                  <h2 className="mt-2 font-display text-[20px] leading-snug font-normal text-foreground">{s.title}</h2>
                  {s.body ? (
                    <p className="mt-1.5 text-[14px] leading-relaxed font-light text-foreground/80">{s.body}</p>
                  ) : null}
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {suggested ? (
                      <button
                        onClick={async () => {
                          setBusy(s.id);
                          try {
                            await run({ data: { businessId, actionKey: suggested.action_key } });
                            await setStatus({ data: { signalId: s.id, status: "acknowledged" } });
                            refresh();
                          } finally {
                            setBusy(null);
                          }
                        }}
                        disabled={busy === s.id}
                        className="rounded-full bg-ember px-3.5 py-1.5 text-[12.5px] font-medium text-on-ember disabled:opacity-50"
                      >
                        {busy === s.id ? "Working…" : suggested.title}
                      </button>
                    ) : null}
                    <button
                      onClick={async () => {
                        await setStatus({ data: { signalId: s.id, status: "dismissed" } });
                        refresh();
                      }}
                      className="rounded-full border border-border px-3 py-1.5 text-[12.5px] font-light text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </div>
                </article>
              );
            })}
            {!open.length ? (
              <p className="text-[14px] font-light text-muted-foreground">
                Nothing outstanding. Your agents will surface things here as they happen.
              </p>
            ) : null}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Scheduled next</h3>
              <ul className="mt-3 space-y-2">
                {(schedules ?? [])
                  .filter((s) => s.active)
                  .map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-2">
                      <span className="text-[13.5px] font-light text-foreground">
                        {(actions ?? []).find((a) => a.action_key === s.action_key)?.title ?? s.action_key}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {s.cadence} · {timeUntil(s.next_run_at)}
                      </span>
                    </li>
                  ))}
                {!(schedules ?? []).some((s) => s.active) ? (
                  <li className="text-[13px] font-light text-muted-foreground">No agents on a schedule yet.</li>
                ) : null}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Agents</h3>
              <ul className="mt-3 space-y-2">
                {(agents ?? []).map((a) => (
                  <li key={a.id} className="border-b border-border/70 pb-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13.5px] font-light text-foreground">{a.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{a.status}</span>
                    </div>
                    {a.status === "inactive" ? (
                      <p className="mt-1 text-[12px] font-light text-muted-foreground">
                        Activates when finance tools are connected.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {runs?.length ? (
            <div className="mt-10">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Recently produced
              </h3>
              <ul className="mt-3 space-y-2">
                {runs.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-2">
                    <span className="text-[13.5px] font-light text-foreground">{r.artifact_title ?? r.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{timeAgo(r.started_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </main>

        <aside className="xl:sticky xl:top-[76px] xl:h-[calc(100vh-100px)] xl:self-start">
          <Clara businessId={businessId} compact />
        </aside>
      </div>
    </div>
  );
}
