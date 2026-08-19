import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import {
  EMPTY_SEED,
  INDUSTRIES,
  OBJECTIVES,
  STAGES,
  industryByKey,
  storeSeed,
  type Seed,
} from "@/lib/industries";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Start your plan — Clarity 360" },
      {
        name: "description",
        content:
          "Six fields, then choose how Clara learns your business: correct her draft, or decide the forks only you can decide.",
      },
      { property: "og:title", content: "Start your plan — Clarity 360" },
      {
        property: "og:description",
        content: "Correct our draft, or make the decisions only you can make. Either way you end with a living plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntakePage,
});

const fieldLabel = "font-mono text-[10px] uppercase tracking-[0.16em] text-ember";
const inputBase =
  "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-[15px] font-light text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ember/60";
const selectBase = `${inputBase} appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-11`;
const caret =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23B33F16' stroke-width='1.5'><path d='M1 1.5 6 6.5 11 1.5'/></svg>\")";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={fieldLabel}>{label}</div>
      {children}
      {hint ? <div className="mt-1.5 text-[12px] font-light text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function IntakePage() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState<Seed>(EMPTY_SEED);
  const industry = industryByKey(seed.industryKey);

  const set = (patch: Partial<Seed>) => setSeed((s) => ({ ...s, ...patch }));

  const ready =
    seed.name.trim() && seed.stage && seed.industryKey && seed.location.trim() && seed.objective;

  function go(path: "/draft" | "/forks") {
    storeSeed(seed);
    navigate({ to: path });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-5">
        <Logo />
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-24 pt-6">
        <div className="clara-rise">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Step 1 of 2</div>
          <h1 className="mt-3 font-display text-[42px] leading-[1.05] font-normal tracking-[-0.03em] text-foreground">
            Six things and Clara can start.
          </h1>
          <p className="mt-3 max-w-[38em] text-[15px] font-light leading-relaxed text-muted-foreground">
            She already knows how your industry usually works. All she needs from you is what is specialised about
            yours — and that comes next, in whichever way suits you.
          </p>

          <div className="mt-9 grid gap-6">
            <Field label="Business name">
              <input
                value={seed.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Little Live Oak"
                className={inputBase}
              />
            </Field>

            <Field label="Stage">
              <select
                value={seed.stage}
                onChange={(e) => set({ stage: e.target.value })}
                className={selectBase}
                style={{ backgroundImage: caret }}
              >
                <option value="">Where are you today?</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Industry">
                <select
                  value={seed.industryKey}
                  onChange={(e) => set({ industryKey: e.target.value, subcategory: "" })}
                  className={selectBase}
                  style={{ backgroundImage: caret }}
                >
                  <option value="">Choose a category</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i.key} value={i.key}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Domain">
                <select
                  value={seed.subcategory}
                  onChange={(e) => set({ subcategory: e.target.value })}
                  disabled={!industry}
                  className={`${selectBase} disabled:opacity-45`}
                  style={{ backgroundImage: caret }}
                >
                  <option value="">{industry ? "Choose a domain" : "Pick an industry first"}</option>
                  {(industry?.subcategories ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Zip code or online" hint="A trade area changes the plan more than almost anything else.">
                <input
                  value={seed.location}
                  onChange={(e) => set({ location: e.target.value })}
                  placeholder="78665 — or Online"
                  className={inputBase}
                />
              </Field>
              <Field label="Website (optional)">
                <input
                  value={seed.website}
                  onChange={(e) => set({ website: e.target.value })}
                  placeholder="littleliveoak.com"
                  className={inputBase}
                />
              </Field>
            </div>

            <Field label="Objective">
              <select
                value={seed.objective}
                onChange={(e) => set({ objective: e.target.value })}
                className={selectBase}
                style={{ backgroundImage: caret }}
              >
                <option value="">What should this plan get you?</option>
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Step 2 of 2 · pick one</div>
            <h2 className="mt-3 font-display text-[30px] leading-[1.1] font-normal text-foreground">
              How should Clara learn the rest?
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                disabled={!ready}
                onClick={() => go("/draft")}
                className="group rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-ember disabled:opacity-40 disabled:hover:border-border"
              >
                <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">Approach one</div>
                <div className="mt-3 font-display text-[24px] font-medium leading-tight text-foreground">
                  Draft your plan
                </div>
                <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">
                  Clara writes the whole plan first and marks every assumption she had to make. You tell her which
                  guesses are wrong, and she re-runs whatever they touch.
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                  We draft · you correct →
                </div>
              </button>

              <button
                disabled={!ready}
                onClick={() => go("/forks")}
                className="group rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-ember disabled:opacity-40 disabled:hover:border-border"
              >
                <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">Approach two</div>
                <div className="mt-3 font-display text-[24px] font-medium leading-tight text-foreground">
                  Discover your plan
                </div>
                <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">
                  Clara brings you the forks only you can settle — two roads, both defensible, each with the
                  consequences spelled out. You choose; the plan follows.
                </p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                  Share your decisions →
                </div>
              </button>
            </div>
            {!ready ? (
              <p className="mt-4 text-[12.5px] font-light text-muted-foreground">
                Fill in the six fields above — the website is the only optional one.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
