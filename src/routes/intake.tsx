import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import {
  EMPTY_SEED,
  INDUSTRIES,
  OBJECTIVES,
  REACH_MODELS,
  REGIONS,
  SERVICE_RADII,
  STAGES,
  TRADE_AREA_RADII,
  industryByKey,
  marketComplete,
  needsBase,
  needsRegions,
  needsServiceAreas,
  storeSeed,
  type Market,
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


function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-light transition-colors ${
        active
          ? "border-ember bg-ember/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-ember/50"
      }`}
    >
      {label}
    </button>
  );
}

function MarketFields({
  market,
  onChange,
}: {
  market: Market;
  onChange: (patch: Partial<Market>) => void;
}) {
  const [areaDraft, setAreaDraft] = useState("");

  function addArea() {
    const value = areaDraft.trim();
    if (!value || market.serviceAreas.includes(value)) return setAreaDraft("");
    onChange({ serviceAreas: [...market.serviceAreas, value] });
    setAreaDraft("");
  }

  function toggleRegion(region: string) {
    const next = market.regions.includes(region)
      ? market.regions.filter((r) => r !== region)
      : [...market.regions, region];
    const patch: Partial<Market> = { regions: next };
    if (market.primaryRegion && !next.includes(market.primaryRegion)) patch.primaryRegion = "";
    onChange(patch);
  }

  const radiusOptions = market.reach === "on_premise" ? TRADE_AREA_RADII : SERVICE_RADII;

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className={fieldLabel}>Audience &amp; footprint</div>
      <p className="mt-2 text-[12.5px] font-light leading-relaxed text-muted-foreground">
        Where the business sits and where its customers come from change the plan more than almost anything else.
      </p>

      <div className="mt-5 grid gap-5">
        <Field label="Reach model">
          <select
            value={market.reach}
            onChange={(e) => onChange({ reach: e.target.value as Market["reach"] })}
            className={selectBase}
            style={{ backgroundImage: caret }}
          >
            <option value="">How do customers reach you?</option>
            {REACH_MODELS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} — {r.hint}
              </option>
            ))}
          </select>
        </Field>

        {needsBase(market.reach) ? (
          <Field label="Base location" hint="City and state, or zip — where the business physically sits.">
            <input
              value={market.baseLocation}
              onChange={(e) => onChange({ baseLocation: e.target.value })}
              placeholder="Round Rock, TX 78665"
              className={inputBase}
            />
          </Field>
        ) : null}

        {needsServiceAreas(market.reach) ? (
          <Field label="Service area" hint="Add the zips or cities you actually serve.">
            <div className="mt-2 flex gap-2">
              <input
                value={areaDraft}
                onChange={(e) => setAreaDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArea();
                  }
                }}
                placeholder="78665, Georgetown, Pflugerville…"
                className={`${inputBase} mt-0`}
              />
              <button
                type="button"
                onClick={addArea}
                className="mt-0 shrink-0 rounded-xl border border-border px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-ember"
              >
                Add
              </button>
            </div>
            {market.serviceAreas.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {market.serviceAreas.map((a) => (
                  <Chip
                    key={a}
                    label={`${a} ×`}
                    active
                    onClick={() => onChange({ serviceAreas: market.serviceAreas.filter((x) => x !== a) })}
                  />
                ))}
              </div>
            ) : null}
          </Field>
        ) : null}

        {market.reach && market.reach !== "online" ? (
          <Field
            label={market.reach === "on_premise" ? "Trade-area radius" : "Crew radius"}
            hint={
              market.reach === "on_premise"
                ? "How far customers realistically travel to you."
                : "How far crews will travel from base."
            }
          >
            <select
              value={market.radius}
              onChange={(e) => onChange({ radius: e.target.value })}
              className={selectBase}
              style={{ backgroundImage: caret }}
            >
              <option value="">Choose a radius</option>
              {radiusOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {needsRegions(market.reach) ? (
          <Field label="Markets served" hint="Pick every region you sell into today.">
            <div className="mt-2 flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <Chip key={r} label={r} active={market.regions.includes(r)} onClick={() => toggleRegion(r)} />
              ))}
            </div>
            {market.regions.length > 1 ? (
              <select
                value={market.primaryRegion}
                onChange={(e) => onChange({ primaryRegion: e.target.value })}
                className={selectBase}
                style={{ backgroundImage: caret }}
              >
                <option value="">Primary market (optional)</option>
                {market.regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : null}
          </Field>
        ) : null}

        {market.reach ? (
          <Field label="Who are your customers? (optional)">
            <input
              value={market.audienceNote}
              onChange={(e) => onChange({ audienceNote: e.target.value })}
              placeholder="Dual-income parents within 10 minutes of the campus"
              className={inputBase}
            />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

function IntakePage() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState<Seed>(EMPTY_SEED);
  const industry = industryByKey(seed.industryKey);

  const set = (patch: Partial<Seed>) => setSeed((s) => ({ ...s, ...patch }));
  const setMarket = (patch: Partial<Market>) =>
    setSeed((s) => ({ ...s, market: { ...s.market, ...patch } }));

  const ready =
    seed.name.trim() && seed.stage && seed.industryKey && marketComplete(seed.market) && seed.objective;


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
