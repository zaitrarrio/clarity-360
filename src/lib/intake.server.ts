import { getRequestHeader } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { DOMAINS } from "./clarity";
import { admin, gateway, CLARA_MODEL, ACTION_INSTRUCTIONS } from "./clarity.server";

type IntakeAnswer = { key: string; stage: string; question: string; answer: string };

type GeneratedSection = {
  domain_key: string;
  title: string;
  summary: string;
  findings: string[];
  decisions: string[];
  metrics: { label: string; value: string }[];
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The plan came back unreadable. Try again.");
  return JSON.parse(raw.slice(start, end + 1));
}

async function requireUser() {
  const db = await admin();
  const header = getRequestHeader("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Create an account to generate your own plan.");
  const { data } = await db.auth.getUser(token);
  if (!data?.user) throw new Error("Create an account to generate your own plan.");
  return data.user;
}

export async function buildPlan(input: { name: string; industry: string; answers: IntakeAnswer[] }) {
  const user = await requireUser();
  const db = await admin();

  const answerBlock = input.answers
    .filter((a) => a.answer.trim())
    .map((a) => `- (${a.stage}) ${a.question}\n  ${a.answer}`)
    .join("\n");

  const domainList = DOMAINS.map((d) => `${d.key} = ${d.label}`).join(", ");

  const result = streamText({
    model: gateway()(CLARA_MODEL),
    system: `You are Clarity 360's plan builder. From an intake you produce a seven-domain operating plan
that is specific to this business and this industry — never generic startup advice.
Every finding must contain a concrete number, name, or observable fact. Invent plausible, clearly
industry-appropriate figures where the intake is silent, and keep them internally consistent across domains.
Return ONLY JSON, no prose.`,
    prompt: `Business name: ${input.name}
Industry: ${input.industry}

Intake:
${answerBlock}

Return JSON of this exact shape:
{"sections":[{"domain_key":"<one of: ${domainList}>","title":"...","summary":"2-3 sentences","findings":["4 specific findings"],"decisions":["2 decisions that change what the plan is"],"metrics":[{"label":"...","value":"..."},{"label":"...","value":"..."},{"label":"...","value":"..."}]}]}
Include exactly seven sections, one per domain key, in the order given.`,
  });

  const text = await result.text;
  const parsed = extractJson(text) as { sections?: GeneratedSection[] };
  const sections = (parsed.sections ?? []).filter((s) => DOMAINS.some((d) => d.key === s.domain_key));
  if (sections.length < 3) throw new Error("The plan came back incomplete. Try again.");

  const { resolveTenant, ensureMembership } = await import("./tenant.server");
  const tenant = await resolveTenant();
  await ensureMembership(tenant.id, user.id);

  const { data: business, error } = await db
    .from("businesses")
    .insert({
      user_id: user.id,
      tenant_id: tenant.id,
      name: input.name,
      tagline: sections[0]?.summary?.slice(0, 180) ?? null,
      industry: input.industry,
      stage: input.answers.find((a) => a.key === "stage")?.answer ?? "New",
      is_demo: false,
    })
    .select("id")
    .single();
  if (error || !business) throw new Error("Could not save the plan.");

  await db
    .from("business_members")
    .upsert({ business_id: business.id, user_id: user.id, role: "owner" }, { onConflict: "business_id,user_id" });

  await db.from("intake_responses").insert(
    input.answers.map((a, i) => ({
      business_id: business.id,
      stage: a.stage,
      question_key: a.key,
      question: a.question,
      answer: a.answer,
      ordinal: i + 1,
    })),
  );

  await db.from("plan_sections").insert(
    sections.map((s) => {
      const meta = DOMAINS.find((d) => d.key === s.domain_key)!;
      return {
        business_id: business.id,
        domain_key: s.domain_key,
        title: s.title || meta.label,
        kicker: `Report ${meta.n}`,
        ordinal: DOMAINS.findIndex((d) => d.key === s.domain_key) + 1,
        summary: s.summary,
        findings: s.findings ?? [],
        decisions: s.decisions ?? [],
        metrics: s.metrics ?? [],
      };
    }),
  );

  await db.from("agents").insert([
    {
      business_id: business.id,
      agent_key: "clara",
      name: "Clara",
      description: "The central agent. Holds the whole plan and assembles your agenda.",
      status: "active",
    },
    ...DOMAINS.map((d) => ({
      business_id: business.id,
      agent_key: d.key,
      name: d.agent,
      domain_key: d.key,
      description: `Works the ${d.label.toLowerCase()} domain of your plan.`,
      status: "idle",
    })),
  ]);

  const catalogue: { key: string; domain: string; title: string; kind: "one_shot" | "recurring"; agent: string }[] = [
    { key: "competitor_price_watch", domain: "market", title: "Watch competitor pricing", kind: "recurring", agent: "market" },
    { key: "market_brief", domain: "market", title: "Write a market brief", kind: "one_shot", agent: "market" },
    { key: "pricing_experiment", domain: "offer", title: "Design a pricing change", kind: "one_shot", agent: "offer" },
    { key: "daily_post", domain: "growth", title: "Create today's post", kind: "recurring", agent: "brand" },
    { key: "enrollment_sequence", domain: "growth", title: "Build the follow-up sequence", kind: "one_shot", agent: "growth" },
    { key: "build_website", domain: "growth", title: "Create my website", kind: "one_shot", agent: "brand" },
    { key: "pitch_deck", domain: "growth", title: "Generate a pitch deck", kind: "one_shot", agent: "finance" },
    { key: "coverage_check", domain: "operations", title: "Check capacity and coverage", kind: "recurring", agent: "operations" },
    { key: "cash_forecast", domain: "finance", title: "Forecast cash", kind: "recurring", agent: "finance" },
    { key: "prototype_brief", domain: "brand", title: "Draft a prototype brief", kind: "one_shot", agent: "brand" },
    { key: "compliance_sweep", domain: "risk", title: "Sweep compliance dates", kind: "recurring", agent: "risk" },
  ];

  const { data: insertedActions } = await db
    .from("actions")
    .insert(
      catalogue.map((a, i) => ({
        business_id: business.id,
        domain_key: a.domain,
        action_key: a.key,
        title: a.title,
        description: ACTION_INSTRUCTIONS[a.key] ?? null,
        kind: a.kind,
        agent_key: a.agent,
        ordinal: i + 1,
      })),
    )
    .select("id, action_key, agent_key");

  // Every agent runs daily by default; the owner can switch any action to
  // weekly, monthly, or on-demand from the Actions page.
  if (insertedActions?.length) {
    await db.from("agent_schedules").insert(
      insertedActions.map((a, i) => ({
        business_id: business.id,
        action_id: a.id,
        action_key: a.action_key,
        agent_key: a.agent_key,
        cadence: "daily",
        // stagger so the tick does not run everything at once
        next_run_at: new Date(Date.now() + (2 + i) * 3600_000).toISOString(),
        active: true,
      })),
    );
  }

  await db.from("signals").insert({
    business_id: business.id,
    agent_key: "clara",
    severity: "info",
    title: "Your plan is live",
    body: "Seven reports are ready. Start with the decisions — they are the parts that change what the plan is.",
    status: "new",
  });

  return { businessId: business.id };
}
