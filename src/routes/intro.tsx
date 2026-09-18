import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import aurora from "@/assets/intro-aurora.jpg";
import { HeaderAccountControls } from "@/components/clarity/HeaderAccountControls";
import { HeaderSiteMenu } from "@/components/clarity/HeaderSiteMenu";
import { marketComplete, readStoredSeed } from "@/lib/industries";
import { brandName, brandWordmark, useTenant } from "@/lib/tenant";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "Meet Clarity 360 — the Growth OS command surface" },
      {
        name: "description",
        content:
          "An introduction to Clarity 360: a living seven-domain operating plan held by Clara, worked by agents that run actions, watch competitors, and surface the next move.",
      },
      { property: "og:title", content: "Meet Clarity 360" },
      {
        property: "og:description",
        content: "One command surface for your plan, your agents, and every action that moves the business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Intro,
});

const PILLARS = [
  {
    n: "01",
    title: "A plan that stays alive",
    body: "Seven linked domains — market, offer, growth, operations, finance, messaging, risk — updated as the business moves.",
  },
  {
    n: "02",
    title: "Clara, at the center",
    body: "One agent holds the whole plan and translates a question into the action that answers it.",
  },
  {
    n: "03",
    title: "Agents that keep watch",
    body: "Domain agents run on a schedule and raise signals the moment a competitor, cost, or channel shifts.",
  },
];

function Intro() {
  const tenant = useTenant();
  const { lead, tail } = brandWordmark(tenant);
  const name = brandName(tenant);
  const navigate = useNavigate();

  /**
   * "Get started" resumes an existing seed straight into the draft loop; a
   * first-time visitor is sent to intake to create the plan workspace first.
   */
  function getStarted() {
    const seed = readStoredSeed();
    const ready =
      seed &&
      seed.name.trim() &&
      seed.stage &&
      seed.industryKey &&
      seed.objective &&
      marketComplete(seed.market);
    navigate({ to: ready ? "/draft" : "/intake" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <img
        src={aurora}
        alt=""
        width={1920}
        height={1088}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/55 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 md:px-10">
        <header className="flex items-center gap-3">
          <HeaderSiteMenu />
          <span className="flex-1" />
          <HeaderAccountControls signedOut={(
            <Link to="/" className="rounded-full border border-border/70 px-3 py-1.5 text-[12.5px] text-muted-foreground no-underline hover:text-foreground">Explore the plan</Link>
          )} />
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="label-mono text-ember">Introducing</p>
          <h1 className="mt-4 max-w-3xl text-balance text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            {tenant.branding.heroTitle?.trim() || "Orchestrate your growth"}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-[16px] font-light leading-relaxed text-muted-foreground">
            {tenant.branding.heroBody?.trim() ||
              `${name} turns an idea into a living seven-domain operating plan — held by Clara, worked by agents that run actions and watch for change.`}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={getStarted}
              className="rounded-full bg-ember-soft px-6 py-2.5 text-[13.5px] font-semibold text-on-ember shadow-ember hover:bg-ember"
            >
              Get started
            </button>
            <Link
              to="/plan"
              className="rounded-full border border-border px-6 py-2.5 text-[13.5px] font-medium text-foreground no-underline hover:bg-card"
            >
              See a live plan
            </Link>
          </div>


          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.n} className="bg-card/70 p-5 backdrop-blur-md">
                <p className="label-mono text-ember">{p.n}</p>
                <p className="mt-2 text-balance text-[15px] font-medium">{p.title}</p>
                <p className="mt-1.5 text-pretty text-[13px] font-light leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </main>

        <footer className="pb-2 text-[12px] text-muted-foreground">
          {tenant.branding.footerText?.trim() || `© ${new Date().getFullYear()} ${name}`}
        </footer>
      </div>
    </div>
  );
}
