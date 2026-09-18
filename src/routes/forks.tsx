import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import { DetailToggle } from "@/components/clarity/DetailToggle";
import { Gloss, GlossaryProvider } from "@/components/clarity/Glossary";
import { supabase } from "@/integrations/supabase/client";
import { buildPlanFromIntake } from "@/lib/clarity.functions";
import { nextForkRound } from "@/lib/onboarding.functions";
import { marketLines, readStoredSeed, seedIndustryLabel, type Seed } from "@/lib/industries";
import type { Decision, ForkRound } from "@/lib/onboarding.types";
import { clearProgressEverywhere, resumeProgress, saveProgress, savedAtLabel, syncProgress } from "@/lib/progress";
import { requireAuthOrRedirect } from "@/lib/require-auth";
import { useDetailMode } from "@/lib/use-detail-mode";

export const Route = createFileRoute("/forks")({
  ssr: false,
  beforeLoad: () => requireAuthOrRedirect("/forks"),
  head: () => ({
    meta: [
      { title: "Discover your plan — Clarity 360" },
      {
        name: "description",
        content:
          "Clara brings you the forks only you can settle — two defensible roads, consequences spelled out — until your plan is 90% covered.",
      },
      { property: "og:title", content: "Discover your plan — Clarity 360" },
      { property: "og:description", content: "Share your decisions. The plan follows them, traceably." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForksPage,
});

const TARGET = 90;

function ForksPage() {
  const navigate = useNavigate();
  const runRound = useServerFn(nextForkRound);
  const build = useServerFn(buildPlanFromIntake);
  const started = useRef(false);

  const [seed, setSeed] = useState<Seed | null>(null);
  const [round, setRound] = useState<ForkRound | null>(null);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [busy, setBusy] = useState(true);
  const [summary, setSummary] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState<string | null>(null);
  const [detailed, setDetailed] = useDetailMode();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const stored = readStoredSeed();
      const resumedState = await resumeProgress("forks", stored?.name ?? null);
      if (resumedState?.progress.round) {
        setSeed(resumedState.seed);
        setRound(resumedState.progress.round);
        setIndex(resumedState.progress.index);
        setDecisions(resumedState.progress.decisions);
        setSummary(resumedState.progress.summary);
        setResumed(savedAtLabel(resumedState.progress.savedAt));
        setBusy(false);
        return;
      }
      if (!stored) {
        navigate({ to: "/intake" });
        return;
      }
      setSeed(stored);
      void load(stored, []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!seed || !round) return;
    const progress = {
      mode: "forks" as const,
      seedName: seed.name,
      savedAt: Date.now(),
      round,
      index,
      decisions,
      summary,
    };
    saveProgress(progress);
    syncProgress(progress, seed);
  }, [seed, round, index, decisions, summary]);

  async function load(currentSeed: Seed, history: Decision[]) {
    setBusy(true);
    setError(null);
    try {
      const result = await runRound({ data: { seed: currentSeed, decisions: history } });
      setRound(result);
      setIndex(0);
      setChoice(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clara couldn't frame the next decision. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function advance() {
    if (!round || !seed || !choice) return;
    const fork = round.forks[index];
    if (!fork) return;
    const option = fork.options.find((o) => o.key === choice);
    const answer =
      choice === OTHER_KEY ? `Other — ${otherText.trim()}` : (option?.label ?? choice);
    if (choice === OTHER_KEY && !otherText.trim()) return;
    const next: Decision[] = [
      ...decisions,
      { forkId: fork.id, question: fork.question, choice: answer },
    ];
    setDecisions(next);
    setChoice(null);
    setOtherText("");
    if (index + 1 < round.forks.length) {
      setIndex(index + 1);
    } else if (round.coverage >= TARGET) {
      setSummary(true);
    } else {
      void load(seed, next);
    }
  }

  async function finish() {
    if (!seed) return;
    setBuilding(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setBuilding(false);
        setError("Create an account to save your plan — we'll bring you right back with your answers.");
        navigate({ to: "/auth", search: { redirect: "/forks" } });
        return;
      }
      const result = await build({
        data: {
          name: seed.name,
          industry: seedIndustryLabel(seed),
          answers: [
            { key: "intake_seed", stage: "Seed", question: "Intake selections", answer: JSON.stringify(seed) },
            { key: "stage", stage: "Seed", question: "Where are you today?", answer: seed.stage },
            ...marketLines(seed.market).map((line, i) => {
              const [label, ...rest] = line.split(": ");
              return {
                key: `market_${i + 1}`,
                stage: "Seed",
                question: label ?? "Market",
                answer: rest.join(": "),
              };
            }),
            { key: "website", stage: "Seed", question: "Website", answer: seed.website },
            { key: "objective", stage: "Seed", question: "What should this plan get you?", answer: seed.objective },
            ...decisions.map((d, i) => ({
              key: `decision_${i + 1}`,
              stage: "Decisions",
              question: d.question,
              answer: d.choice,
            })),
          ],
        },
      });
      if (result?.businessId) {
        void clearProgressEverywhere();
        navigate({ to: "/plan" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clara couldn't write the plan. Try again.");
      setBuilding(false);
    }
  }

  const fork = round?.forks[index];
  const coverage = round?.coverage ?? 55;

  return (
    <GlossaryProvider terms={round?.glossary}>
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          {round && !busy && !building ? <DetailToggle detailed={detailed} onChange={setDetailed} /> : null}
          <button
            onClick={() => navigate({ to: "/intake" })}
            className="rounded-full border border-border px-4 py-2 text-[12.5px] font-light text-muted-foreground hover:text-foreground"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-4">
        {building ? (
          <div className="py-24 text-center">
            <span className="clara-orb mx-auto block" />
            <h1 className="mt-6 font-display text-[32px] font-normal text-foreground">
              Building the plan around your decisions
            </h1>
            <p className="mt-2 text-[14px] font-light text-muted-foreground">
              Every departure from the norm will trace back to something you chose.
            </p>
          </div>
        ) : busy ? (
          <div className="py-24 text-center">
            <span className="clara-orb mx-auto block" />
            <h1 className="mt-6 font-display text-[32px] font-normal text-foreground">
              Working out what only <em className="italic text-ember">you</em> can decide
            </h1>
            <p className="mt-2 text-[14px] font-light text-muted-foreground">
              Everything an analyst could assume about {seed ? seedIndustryLabel(seed) : "your category"}, Clara has
              already assumed.
            </p>
          </div>
        ) : summary && round ? (
          <div className="clara-rise">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember-deep">
              {decisions.length} decisions · coverage {coverage}%
              {resumed ? ` · resumed, saved ${resumed}` : ""}
            </div>
            <h1 className="mt-3 font-display text-[40px] leading-[1.08] font-normal tracking-[-0.03em] text-foreground">
              Your plan follows your decisions.
            </h1>
            <p className="mt-3 max-w-[42em] text-[15px] font-light leading-relaxed text-muted-foreground">
              {round.headline}
            </p>

            <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="grid gap-3">
                {decisions.map((d) => (
                  <div key={d.forkId} className="rounded-xl border border-border bg-card p-5">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      {d.question}
                    </div>
                    <div className="mt-2 font-display text-[21px] font-medium text-foreground">{d.choice}</div>
                  </div>
                ))}
                {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => void finish()}
                    className="rounded-full bg-ember px-6 py-3 text-[14px] font-medium text-on-ember"
                  >
                    Build it →
                  </button>
                  <button
                    onClick={() => seed && void load(seed, decisions)}
                    className="text-[13px] font-light text-muted-foreground hover:text-foreground"
                  >
                    Give me more decisions
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-linen p-6">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">
                  Inferred, so you did not have to say it
                </div>
                <div className="mt-4 grid gap-4">
                  {round.inferred.map((i) => (
                    <div key={i.k}>
                      <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                        {i.k}
                      </div>
                      <div className="mt-1 text-[14px] text-foreground">{i.v}</div>
                      <div className="mt-0.5 text-[12.5px] font-light leading-relaxed text-muted-foreground">
                        {i.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : fork ? (
          <div key={fork.id} className="clara-rise">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ember-deep">
                  Decision {decisions.length + 1} · {fork.kicker}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-[3px] w-40 rounded-full bg-parchment">
                  <div
                    className="h-full rounded-full bg-ember transition-all duration-700"
                    style={{ width: `${coverage}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  coverage {coverage}% / {TARGET}%
                </span>
              </div>
            </div>

            <h1 className="mt-6 font-display text-[38px] leading-[1.1] font-normal tracking-[-0.03em] text-foreground">
              {fork.question}
            </h1>
            <p className="mt-3 max-w-[42em] text-[15px] font-light leading-relaxed text-muted-foreground">
              <Gloss>{detailed ? fork.why : fork.plain || fork.why}</Gloss>
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {fork.options.map((o, oi) => {
                const on = choice === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => setChoice(o.key)}
                    className={`relative rounded-2xl border p-6 pt-9 text-left transition-colors ${
                      on ? "border-ember bg-ember/8" : "border-border bg-card hover:border-ember/50"
                    }`}
                  >
                    <span className="absolute left-6 top-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                      {oi + 1}.
                    </span>
                    {on ? (
                      <span className="absolute right-6 top-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ember-deep">Chosen</span>
                    ) : null}
                    <div className="mt-1 font-display text-[24px] font-medium leading-tight text-foreground">
                      {o.label}
                    </div>
                    <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">
                      <Gloss>{detailed ? o.tail : o.plainTail || o.tail}</Gloss>
                    </p>
                    {detailed ? (
                      <div className="mt-4 grid gap-2 border-t border-border pt-4">
                        {o.effects.map((e, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="font-mono text-[12px] leading-5 text-ember">{e.sign}</span>
                            <span className="text-[13px] font-light leading-5 text-foreground">
                              <Gloss>{e.text}</Gloss>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {round?.inferred.length ? (
              <div className="mt-8 rounded-2xl bg-linen p-5">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">
                  Inferred from what you have already chosen · correct her if wrong
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {round.inferred.map((i) => (
                    <div key={i.k}>
                      <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                        {i.k}
                      </div>
                      <div className="mt-1 text-[13.5px] text-foreground">{i.v}</div>
                      <div className="mt-0.5 text-[12.5px] font-light leading-relaxed text-muted-foreground">
                        {i.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="mt-4 text-[13px] text-destructive">{error}</p> : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={advance}
                disabled={!choice}
                className="rounded-full bg-ember px-6 py-3 text-[14px] font-medium text-on-ember disabled:opacity-55"
              >
                {index + 1 < (round?.forks.length ?? 0)
                  ? "Next decision →"
                  : coverage >= TARGET
                    ? "Review my decisions →"
                    : "Continue →"}
              </button>
              {decisions.length >= 2 ? (
                <button
                  onClick={() => setSummary(true)}
                  className="text-[13px] font-light text-muted-foreground hover:text-foreground"
                >
                  That's enough — build it
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[14px] font-light text-destructive">{error}</p>
            <button
              onClick={() => seed && void load(seed, decisions)}
              className="mt-5 rounded-full bg-ember px-6 py-2.5 text-[13.5px] font-medium text-on-ember"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
    </GlossaryProvider>
  );
}
