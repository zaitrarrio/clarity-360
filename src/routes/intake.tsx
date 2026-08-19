import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import { buildPlanFromIntake } from "@/lib/clarity.functions";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Intake — Clarity 360" },
      {
        name: "description",
        content:
          "Eight questions is all Clara needs to write the first version of your seven-domain operating plan.",
      },
      { property: "og:title", content: "Intake — Clarity 360" },
      { property: "og:description", content: "Answer eight questions. Get a living operating plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntakePage,
});

type Q = { key: string; stage: string; question: string; hint: string; placeholder: string };

const QUESTIONS: Q[] = [
  {
    key: "idea",
    stage: "The idea",
    question: "What are you building, in one or two sentences?",
    hint: "Plain language beats pitch language.",
    placeholder: "A small childcare centre for families in the west end who work irregular shifts…",
  },
  {
    key: "customer",
    stage: "The idea",
    question: "Who is it for, specifically?",
    hint: "Name the person, not the segment.",
    placeholder: "Parents of 1–4 year olds, dual income, within 15 minutes…",
  },
  {
    key: "stage",
    stage: "Where you are",
    question: "Where are you today?",
    hint: "Idea, building, first customers, or growing.",
    placeholder: "We have a lease signed and no children enrolled yet.",
  },
  {
    key: "traction",
    stage: "Where you are",
    question: "What evidence do you already have?",
    hint: "Waitlists, revenue, conversations, anything real.",
    placeholder: "31 families on a waitlist from two community meetings.",
  },
  {
    key: "money",
    stage: "Money",
    question: "How does money come in, and what do you charge?",
    hint: "Guess if you have to — Clara will pressure-test it.",
    placeholder: "Monthly tuition, around $1,400 per child…",
  },
  {
    key: "constraint",
    stage: "Money",
    question: "What is the constraint that actually limits you?",
    hint: "Cash, staff, space, time, licence.",
    placeholder: "Staff. I can't open the third room without two more qualified educators.",
  },
  {
    key: "competition",
    stage: "The field",
    question: "Who else could they choose instead?",
    hint: "Include the do-nothing option.",
    placeholder: "Two centres nearby, plus grandparents and nannies.",
  },
  {
    key: "goal",
    stage: "The field",
    question: "What does success look like twelve months out?",
    hint: "One number and one feeling.",
    placeholder: "42 children enrolled and I stop covering shifts myself.",
  },
];

function IntakePage() {
  const navigate = useNavigate();
  const build = useServerFn(buildPlanFromIntake);
  const [step, setStep] = useState(-1);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = QUESTIONS[step];
  const progress = ((step + 1) / (QUESTIONS.length + 1)) * 100;

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const result = await build({
        data: {
          name,
          industry,
          answers: QUESTIONS.map((item) => ({
            key: item.key,
            stage: item.stage,
            question: item.question,
            answer: answers[item.key] ?? "",
          })),
        },
      });
      if (result?.businessId) navigate({ to: "/plan" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clara couldn't write the plan. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-[2px] w-full bg-parchment">
        <div className="h-full bg-ember transition-all duration-500" style={{ width: `${Math.max(4, progress)}%` }} />
      </div>
      <header className="px-6 py-5">
        <Logo />
      </header>

      <div className="mx-auto grid max-w-2xl gap-8 px-6 pb-24 pt-10">
        {busy ? (
          <div className="text-center">
            <span className="clara-orb mx-auto block" />
            <h1 className="mt-6 font-display text-[30px] font-normal text-foreground">Clara is writing your plan</h1>
            <p className="mt-2 text-[14px] font-light text-muted-foreground">
              Seven reports, the decisions inside them, and the agents that will keep them current.
            </p>
          </div>
        ) : step === -1 ? (
          <div className="clara-rise">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Intake</div>
            <h1 className="mt-3 font-display text-[40px] leading-[1.1] font-normal text-foreground">
              Let's start with the basics.
            </h1>
            <div className="mt-8 space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's it called?"
                className="w-full border-b border-border bg-transparent pb-2.5 font-display text-[22px] font-light text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ember"
              />
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="What category is it in? (childcare, SaaS, bakery…)"
                className="w-full border-b border-border bg-transparent pb-2.5 font-display text-[22px] font-light text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ember"
              />
            </div>
            <button
              disabled={!name.trim() || !industry.trim()}
              onClick={() => setStep(0)}
              className="mt-9 rounded-full bg-ember px-6 py-2.5 text-[13.5px] font-medium text-primary-foreground disabled:opacity-40"
            >
              Begin
            </button>
          </div>
        ) : q ? (
          <div key={q.key} className="clara-rise">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              {q.stage} · {String(step + 1).padStart(2, "0")} / {QUESTIONS.length}
            </div>
            <h1 className="mt-3 font-display text-[34px] leading-[1.15] font-normal text-foreground">{q.question}</h1>
            <p className="mt-2 text-[13.5px] font-light text-muted-foreground">{q.hint}</p>
            <textarea
              autoFocus
              rows={4}
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
              placeholder={q.placeholder}
              className="mt-6 w-full resize-none rounded-xl border border-border bg-card p-4 text-[15px] leading-relaxed font-light text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ember/50"
            />
            {error ? <p className="mt-3 text-[13px] text-destructive">{error}</p> : null}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => (step === QUESTIONS.length - 1 ? finish() : setStep(step + 1))}
                disabled={!(answers[q.key] ?? "").trim()}
                className="rounded-full bg-ember px-6 py-2.5 text-[13.5px] font-medium text-primary-foreground disabled:opacity-40"
              >
                {step === QUESTIONS.length - 1 ? "Build my plan" : "Next"}
              </button>
              <button
                onClick={() => setStep(step - 1)}
                className="text-[13px] font-light text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
