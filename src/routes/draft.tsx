import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import { buildPlanFromIntake } from "@/lib/clarity.functions";
import { nextDraftRound } from "@/lib/onboarding.functions";
import { marketLines, readStoredSeed, seedIndustryLabel, type Seed } from "@/lib/industries";
import type { Correction, DraftRound } from "@/lib/onboarding.types";

export const Route = createFileRoute("/draft")({
  head: () => ({
    meta: [
      { title: "Correct the draft — Clarity 360" },
      {
        name: "description",
        content:
          "Clara drafts your seven-report operating plan first and marks every assumption. You correct the handful that move the plan.",
      },
      { property: "og:title", content: "Correct the draft — Clarity 360" },
      { property: "og:description", content: "We draft. You put us right. The plan re-runs around your answer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DraftPage,
});

const TARGET = 90;

function Confidence({ value }: { value: number }) {
  return (
    <div className="text-right">
      <div className="font-display text-[30px] leading-none text-ember">{value}%</div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
        projected coverage · need {TARGET}
      </div>
      <div className="mt-2 h-[3px] w-40 rounded-full bg-parchment">
        <div className="h-full rounded-full bg-ember transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DraftPage() {
  const navigate = useNavigate();
  const runRound = useServerFn(nextDraftRound);
  const build = useServerFn(buildPlanFromIntake);
  const started = useRef(false);

  const [seed, setSeed] = useState<Seed | null>(null);
  const [round, setRound] = useState<DraftRound | null>(null);
  const [pass, setPass] = useState(1);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [picked, setPicked] = useState<Record<string, { label: string; result: string }>>({});
  const [busy, setBusy] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredSeed();
    if (!stored) {
      navigate({ to: "/intake" });
      return;
    }
    setSeed(stored);
    if (started.current) return;
    started.current = true;
    void load(stored, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(currentSeed: Seed, history: Correction[]) {
    setBusy(true);
    setError(null);
    try {
      const result = await runRound({ data: { seed: currentSeed, corrections: history } });
      setRound(result);
      setPicked({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clara couldn't draft that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function pick(flagId: string, where: string, assumed: string, label: string, result: string) {
    setPicked((p) => ({ ...p, [flagId]: { label, result } }));
    setCorrections((c) => [...c.filter((x) => x.flagId !== flagId), { flagId, where, assumed, choice: label, result }]);
  }

  function undo(flagId: string) {
    setPicked((p) => {
      const next = { ...p };
      delete next[flagId];
      return next;
    });
    setCorrections((c) => c.filter((x) => x.flagId !== flagId));
  }

  async function finish() {
    if (!seed) return;
    setBuilding(true);
    setError(null);
    try {
      const result = await build({
        data: {
          name: seed.name,
          industry: seedIndustryLabel(seed),
          answers: [
            { key: "stage", stage: "Seed", question: "Where are you today?", answer: seed.stage },
            { key: "location", stage: "Seed", question: "Zip code or online?", answer: seed.location },
            { key: "website", stage: "Seed", question: "Website", answer: seed.website },
            { key: "objective", stage: "Seed", question: "What should this plan get you?", answer: seed.objective },
            ...corrections.map((c, i) => ({
              key: `correction_${i + 1}`,
              stage: "Corrections to the draft",
              question: `${c.where} — Clara assumed: ${c.assumed}`,
              answer: c.choice,
            })),
          ],
        },
      });
      if (result?.businessId) navigate({ to: "/plan" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clara couldn't write the plan. Try again.");
      setBuilding(false);
    }
  }

  const coverage = round?.coverage ?? 55;
  const enough = coverage >= TARGET;
  const answered = Object.keys(picked).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <button
          onClick={() => navigate({ to: "/intake" })}
          className="rounded-full border border-border px-4 py-2 text-[12.5px] font-light text-muted-foreground hover:text-foreground"
        >
          Leave
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        {building ? (
          <div className="py-24 text-center">
            <span className="clara-orb mx-auto block" />
            <h1 className="mt-6 font-display text-[32px] font-normal text-foreground">
              Re-running the plan around your corrections
            </h1>
            <p className="mt-2 text-[14px] font-light text-muted-foreground">
              Seven reports, the decisions inside them, and the agents that keep them current.
            </p>
          </div>
        ) : busy ? (
          <div className="py-24 text-center">
            <span className="clara-orb mx-auto block" />
            <h1 className="mt-6 font-display text-[32px] font-normal text-foreground">
              {pass === 1 ? "Drafting against" : "Re-drafting"}{" "}
              <em className="italic text-ember">{seed ? seedIndustryLabel(seed) : "your plan"}</em>
            </h1>
            <p className="mt-2 text-[14px] font-light text-muted-foreground">
              Marking every assumption she has to make along the way.
            </p>
          </div>
        ) : round ? (
          <div className="clara-rise">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[42em]">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember-deep">
                  Pass {pass} · your draft, marked up
                </div>
                <h1 className="mt-3 font-display text-[38px] leading-[1.1] font-normal tracking-[-0.03em] text-foreground">
                  {round.headline}
                </h1>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-muted-foreground">{round.note}</p>
              </div>
              <Confidence value={coverage} />
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="grid gap-4">
                {round.flags.map((flag) => {
                  const chosen = picked[flag.id];
                  return (
                    <div key={flag.id} className="rounded-2xl border border-border bg-card p-6">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="rounded-full bg-ember/12 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ember-deep">
                          {flag.tag}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {flag.where}
                        </span>
                      </div>
                      <div className="mt-3 font-display text-[23px] leading-snug font-medium text-foreground">
                        {flag.assumed}
                      </div>
                      <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">{flag.why}</p>

                      {chosen ? (
                        <div className="mt-4 rounded-xl border border-ember/30 bg-ember/8 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ember-deep">
                              Corrected · {chosen.label}
                            </span>
                            <button
                              onClick={() => undo(flag.id)}
                              className="text-[12px] font-light text-muted-foreground hover:text-foreground"
                            >
                              Undo
                            </button>
                          </div>
                          <p className="mt-2 text-[13.5px] font-light leading-relaxed text-foreground">
                            {chosen.result}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {flag.fixes.map((fix) => (
                            <button
                              key={fix.key}
                              onClick={() => pick(flag.id, flag.where, flag.assumed, fix.label, fix.result)}
                              className="rounded-full border border-border px-4 py-2 text-[13px] font-light text-foreground transition-colors hover:border-ember"
                            >
                              {fix.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      if (enough) {
                        void finish();
                      } else if (seed) {
                        setPass((p) => p + 1);
                        void load(seed, corrections);
                      }
                    }}
                    className="rounded-full bg-ember px-6 py-3 text-[14px] font-medium text-primary-foreground"
                  >
                    {enough ? "Build my plan →" : "Keep going — show me the next gaps"}
                  </button>
                  {!enough && corrections.length ? (
                    <button
                      onClick={() => void finish()}
                      className="text-[13px] font-light text-muted-foreground hover:text-foreground"
                    >
                      Build it anyway
                    </button>
                  ) : null}
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {answered} of {round.flags.length} corrected this pass · {corrections.length} in total
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-linen p-6">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">
                  What your corrections changed
                </div>
                <div className="mt-4 grid gap-3">
                  {round.ripple.map((r) => (
                    <div key={r.name} className="flex gap-3">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                      <div>
                        <div className="text-[13.5px] font-normal text-foreground">{r.name}</div>
                        {r.note ? (
                          <div className="mt-0.5 text-[12.5px] font-light leading-relaxed text-muted-foreground">
                            {r.note}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-border pt-4 text-[12px] font-light leading-relaxed text-muted-foreground">
                  Every correction is reversible, and Clara keeps her original guess in case you want to compare.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[14px] font-light text-destructive">{error}</p>
            <button
              onClick={() => seed && void load(seed, corrections)}
              className="mt-5 rounded-full bg-ember px-6 py-2.5 text-[13.5px] font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
