import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/clarity/AppHeader";
import { HeaderAccountControls } from "@/components/clarity/HeaderAccountControls";
import { HeaderSiteMenu } from "@/components/clarity/HeaderSiteMenu";
import { DOMAINS } from "@/lib/clarity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clarity 360 — the Growth OS for going zero to exponential" },
      {
        name: "description",
        content:
          "Clarity 360 turns an idea into a living seven-domain operating plan, held by Clara and worked by domain agents that run actions, watch competitors, and bring you the moves that matter.",
      },
      { property: "og:title", content: "Clarity 360 — the Growth OS" },
      {
        property: "og:description",
        content: "A living operating plan with an agent on every domain. From idea to exponential, in any category.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CAPABILITIES = [
  {
    n: "01",
    title: "A plan that answers back",
    body: "Seven linked reports — market, offer, growth, operations, finance, brand, risk. Clara holds all of them at once, so a pricing change shows up in the cash forecast before you ask.",
  },
  {
    n: "02",
    title: "Actions, not recommendations",
    body: "Generate the pitch deck. Build the site. Draft the prototype brief. Write today's post. Each one runs inside the plan and comes back as a real artifact.",
  },
  {
    n: "03",
    title: "Agents that keep working",
    body: "Hand a watch to the Market Agent and it checks competitor pricing on a cadence, then alerts you the day someone undercuts you. The Finance Agent forecasts cash. The Risk Agent watches the dates.",
  },
  {
    n: "04",
    title: "An agenda that finds you",
    body: "Signals arrive as events happen and are assembled into a daily agenda — two or three moves that matter, each with the button that does it.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-border bg-background/85 px-6 py-4 backdrop-blur-md">
        <HeaderSiteMenu />
        <div className="flex-1" />
        <Link
          to="/plan"
          className="text-[13px] font-light text-muted-foreground no-underline hover:text-foreground"
        >
          See a live plan
        </Link>
        <HeaderAccountControls signedOut={(
          <Link to="/intake" className="rounded-full bg-ember px-4 py-2 text-[13px] font-medium text-on-ember no-underline shadow-ember">Start</Link>
        )} />
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:pt-28">
        <div className="clara-rise">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ember">The Growth OS</div>
          <h1 className="mt-5 max-w-4xl font-display text-[52px] leading-[1.02] font-normal tracking-tight text-foreground md:text-[76px]">
            From an idea to a growing business — with the whole <em className="italic text-ember">360</em> in view.
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-[1.65] font-light text-muted-foreground">
            Clarity 360 turns what you know into an operating plan across seven domains, then gives that plan a
            nervous system: Clara, and an agent on every domain that can actually do the work.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/intake"
              className="rounded-full bg-ember px-6 py-3 text-[14px] font-medium text-on-ember no-underline shadow-ember"
            >
              Build my plan
            </Link>
            <Link
              to="/plan"
              className="rounded-full border border-border bg-card px-6 py-3 text-[14px] font-light text-foreground no-underline hover:bg-parchment"
            >
              Walk through a real one
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-parchment/50">
        <div className="mx-auto grid max-w-6xl gap-px bg-border px-0 md:grid-cols-4">
          {[
            { k: "7", v: "linked domains" },
            { k: "8", v: "questions to start" },
            { k: "1", v: "agent per domain" },
            { k: "24/7", v: "watching for changes" },
          ].map((s) => (
            <div key={s.v} className="bg-background px-6 py-8">
              <div className="font-display text-[36px] leading-none font-normal text-foreground">{s.k}</div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-display text-[36px] leading-tight font-normal text-foreground md:text-[44px]">
          Most plans die in a document. This one has hands.
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div key={c.n} className="border-t border-border pt-5">
              <div className="font-mono text-[10px] text-ember">{c.n}</div>
              <h3 className="mt-2.5 font-display text-[24px] font-normal text-foreground">{c.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed font-light text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-ink py-20 text-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ember-soft">The seven domains</div>
          <h2 className="mt-4 max-w-2xl font-display text-[38px] leading-tight font-light">
            Every domain is a report, an agent, and a set of things that can be run.
          </h2>
          <div className="mt-12 grid gap-px bg-background/15 md:grid-cols-2 lg:grid-cols-4">
            {DOMAINS.map((d) => (
              <div key={d.key} className="bg-ink px-5 py-6">
                <div className="font-mono text-[10px] text-ember-soft">{d.n}</div>
                <div className="mt-2 font-display text-[21px] font-normal">{d.label}</div>
                <div className="mt-1 text-[12.5px] font-light text-background/55">agent {d.agent}</div>
              </div>
            ))}
            <div className="grid place-items-center bg-ember px-5 py-6 text-center">
              <div>
                <div className="font-display text-[21px] font-normal text-on-ember">Clara</div>
                <div className="mt-1 text-[12.5px] font-light text-on-ember/80">holds all seven</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-[40px] leading-tight font-normal text-foreground">
          Tell Clara what you're building.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15.5px] font-light text-muted-foreground">
          Six fields, then either correct our draft or make the calls only you can make. Then a plan that keeps moving whether or not you're looking at it.
        </p>
        <Link
          to="/intake"
          className="mt-8 inline-block rounded-full bg-ember px-7 py-3 text-[14px] font-medium text-on-ember no-underline shadow-ember"
        >
          Build my plan
        </Link>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
          <Logo size="sm" />
          <span className="text-[12.5px] font-light text-muted-foreground">The Growth OS</span>
          <div className="flex-1" />
          <Link to="/plan" className="text-[12.5px] font-light text-muted-foreground no-underline hover:text-foreground">
            The plan
          </Link>
          <Link to="/agenda" className="text-[12.5px] font-light text-muted-foreground no-underline hover:text-foreground">
            Agenda
          </Link>
        </div>
      </footer>
    </div>
  );
}
