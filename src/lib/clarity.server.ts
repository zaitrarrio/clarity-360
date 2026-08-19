import { getRequestHeader } from "@tanstack/react-start/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

export const CLARA_MODEL = "google/gemini-3.7-flash";

export function gateway() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * The seeded demo business is an open sandbox: anyone can run its actions.
 * Every other business requires a bearer token belonging to its owner.
 */
export async function assertBusinessAccess(businessId: string) {
  const db = await admin();
  const { data: business, error } = await db
    .from("businesses")
    .select("id, name, tagline, industry, stage, location, is_demo, user_id")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !business) throw new Error("Business not found");
  if (business.is_demo) return business;

  const header = getRequestHeader("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Sign in to change this plan");
  const { data: userData } = await db.auth.getUser(token);
  if (!userData?.user || userData.user.id !== business.user_id) {
    throw new Error("Sign in to change this plan");
  }
  return business;
}

export type PlanContext = {
  business: { name: string; tagline: string | null; industry: string | null; stage: string | null; location: string | null };
  sections: { title: string; summary: string | null; findings: unknown; decisions: unknown; metrics: unknown }[];
  signals: { title: string; body: string | null; severity: string }[];
};

export async function loadPlanContext(businessId: string): Promise<PlanContext> {
  const db = await admin();
  const [business, sections, signals] = await Promise.all([
    db.from("businesses").select("name, tagline, industry, stage, location").eq("id", businessId).maybeSingle(),
    db
      .from("plan_sections")
      .select("title, summary, findings, decisions, metrics")
      .eq("business_id", businessId)
      .order("ordinal"),
    db
      .from("signals")
      .select("title, body, severity")
      .eq("business_id", businessId)
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  return {
    business: business.data ?? { name: "", tagline: null, industry: null, stage: null, location: null },
    sections: sections.data ?? [],
    signals: signals.data ?? [],
  };
}

export function planContextPrompt(ctx: PlanContext): string {
  const lines: string[] = [];
  lines.push(`Business: ${ctx.business.name} — ${ctx.business.tagline ?? ""}`);
  lines.push(`Industry: ${ctx.business.industry ?? "unknown"} · Stage: ${ctx.business.stage ?? "unknown"} · ${ctx.business.location ?? ""}`);
  lines.push("");
  lines.push("OPERATING PLAN:");
  for (const s of ctx.sections) {
    lines.push(`## ${s.title}`);
    if (s.summary) lines.push(s.summary);
    lines.push(`Findings: ${JSON.stringify(s.findings)}`);
    lines.push(`Decisions: ${JSON.stringify(s.decisions)}`);
    lines.push(`Metrics: ${JSON.stringify(s.metrics)}`);
    lines.push("");
  }
  if (ctx.signals.length) {
    lines.push("OPEN SIGNALS:");
    for (const s of ctx.signals) lines.push(`- [${s.severity}] ${s.title}: ${s.body ?? ""}`);
  }
  return lines.join("\n");
}

export const CLARA_SYSTEM = `You are Clara, the central agent of Clarity 360 — a growth operating system.
You hold the whole operating plan for one business and you are the interface to it.
You are specific, calm, and never generic. You quote the plan's own numbers back.
You never invent facts that are not in the plan; when something is unknown you say what would need to be measured.
Keep answers tight: a short paragraph or a few bullets. Markdown is fine. Never use headings above ###.
When the user asks you to do something the plan supports — write a post, build a deck, watch a competitor —
use your tools rather than describing what you would do.`;

/** Run a domain agent to produce an artifact for an action. Streams internally. */
export async function generateArtifact(opts: {
  businessId: string;
  actionKey: string;
  title: string;
  agentKey: string | null;
  instruction: string;
}): Promise<{ artifactTitle: string; artifactBody: string }> {
  const ctx = await loadPlanContext(opts.businessId);
  const result = streamText({
    model: gateway()(CLARA_MODEL),
    system: `You are ${opts.agentKey ?? "a"} domain agent inside Clarity 360, working for ${ctx.business.name}.
Produce the finished artifact itself — not a description of it, not a preamble, not an offer to help.
Use the business's real numbers and decisions from the plan. Write in markdown. Never use headings above ###.
Keep it useful and under 500 words unless the artifact genuinely needs more.`,
    prompt: `${planContextPrompt(ctx)}\n\n---\nTASK (${opts.actionKey}): ${opts.instruction}`,
  });
  const text = await result.text;
  return { artifactTitle: opts.title, artifactBody: text.trim() };
}

export const ACTION_INSTRUCTIONS: Record<string, string> = {
  competitor_price_watch:
    "Run this week's competitor price scan. Report which local competitors moved, by how much, and whether any is now priced under this business. End with whether a signal should be raised.",
  market_brief: "Write a one-page local market brief: demand, capacity, where the unmet seats/customers are, and the one structural fact that should drive strategy.",
  pricing_experiment: "Design the next pricing change: what changes, to what number, why it is the least risky lever, and the exact customer-facing explanation.",
  daily_post: "Write today's social post in the owner's voice, drawn from what is true this week in the plan. Add a one-line image suggestion.",
  enrollment_sequence: "Write the full customer follow-up sequence from first contact to commitment: five touches, each with timing, channel, and the actual copy.",
  build_website: "Write the website: page structure, then the actual headline and body copy for the home page, led by the strongest true thing about this business.",
  pitch_deck: "Write a twelve-slide pitch deck outline. For each slide: the slide title and the two or three lines that go on it, using the plan's real numbers.",
  coverage_check: "Check staffing/capacity coverage for the coming week against the plan's constraints. Flag anything the plan cannot absorb.",
  cash_forecast: "Produce a thirteen-week cash view in a compact markdown table using the plan's revenue and cost figures, marking the buffer target.",
  prototype_brief: "Spec the smallest testable version of the highest-leverage new offer: what to build, what to measure, what would make you stop.",
  compliance_sweep: "List every date, coverage line, and document that expires or needs attention in the next ninety days, ordered by how badly it hurts.",
};
