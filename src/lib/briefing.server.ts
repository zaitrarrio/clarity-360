import { generateObject } from "ai";
import { z } from "zod";
import { admin, gateway, CLARA_MODEL, loadPlanContext, planContextPrompt } from "./clarity.server";
import type { Briefing } from "./briefing";

const BriefingObject = z.object({
  headline: z.string().max(90),
  body: z.string().max(900),
  focus_item_keys: z.array(z.string()).max(3),
});

const BRIEFING_SYSTEM = `You are Clara writing today's briefing for one business inside Clarity 360.
Write like someone who actually read the plan, not a generic motivational note.
Ground every sentence in this business's real numbers, decisions, or open signals — never invent one.
Pick 1-3 items from the CANDIDATE checklist items to spotlight today — the ones that most move the
business forward right now given its stage and what's open. Avoid repeating yesterday's focus items
unless nothing else outstanding applies. Say specifically why each spotlighted item matters today,
using real plan detail, not a restated title.
Keep the body under 160 words, markdown-light (short paragraph or a few bullets), no headings above ###.`;

/**
 * Generates (or returns today's already-generated) briefing: a short,
 * plan-grounded headline + body plus 1-3 readiness items to spotlight.
 * Idempotent per business per day unless `force` is set.
 */
export async function generateDailyBriefing(businessId: string, opts?: { force?: boolean }): Promise<Briefing> {
  const db = await admin();
  const today = new Date().toISOString().slice(0, 10);

  if (!opts?.force) {
    const { data: existing } = await db
      .from("business_briefings")
      .select("*")
      .eq("business_id", businessId)
      .eq("briefing_date", today)
      .maybeSingle();
    if (existing) return existing as Briefing;
  }

  const [ctx, itemsRes, recentRes, priorRes] = await Promise.all([
    loadPlanContext(businessId),
    db
      .from("business_readiness_items")
      .select("item_key, category, title, objective, description, status, priority")
      .eq("business_id", businessId)
      .neq("status", "complete")
      .order("priority")
      .limit(10),
    db
      .from("action_runs")
      .select("title, artifact_title, completed_at")
      .eq("business_id", businessId)
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(5),
    db
      .from("business_briefings")
      .select("briefing_date, focus_item_keys")
      .eq("business_id", businessId)
      .order("briefing_date", { ascending: false })
      .limit(3),
  ]);

  const candidates = itemsRes.data ?? [];
  const recentRuns = recentRes.data ?? [];
  const priorFocus = new Set((priorRes.data ?? []).flatMap((b) => b.focus_item_keys ?? []));

  if (!candidates.length && !ctx.sections.length) {
    const fallback = {
      business_id: businessId,
      briefing_date: today,
      headline: "Get the plan started",
      body: "There isn't a plan or checklist yet — head to My Operating Plan to build one, and today's briefing will have something real to say.",
      focus_item_keys: [],
    };
    const { data: saved } = await db
      .from("business_briefings")
      .upsert(fallback, { onConflict: "business_id,briefing_date" })
      .select("*")
      .single();
    return (saved as Briefing) ?? { ...fallback, id: "", created_at: today, updated_at: today };
  }

  const candidateBlock = candidates
    .map((c) => `- ${c.item_key} [${c.category}] ${c.title}: ${c.objective ?? c.description ?? ""}`)
    .join("\n");
  const runsBlock = recentRuns.map((r) => `- ${r.artifact_title ?? r.title} (${r.completed_at})`).join("\n");

  const result = await generateObject({
    model: gateway()(CLARA_MODEL),
    schema: BriefingObject,
    system: BRIEFING_SYSTEM,
    prompt: `${planContextPrompt(ctx)}

CANDIDATE CHECKLIST ITEMS (pick focus_item_keys only from these item_keys):
${candidateBlock || "(none outstanding)"}

RECENTLY PRODUCED:
${runsBlock || "(nothing yet)"}

ITEMS FOCUSED ON RECENTLY (avoid repeating unless nothing else fits):
${[...priorFocus].join(", ") || "(none)"}`,
  }).catch(() => null);

  const candidateKeys = new Set(candidates.map((c) => c.item_key));
  const headline = result?.object.headline ?? `Today at ${ctx.business.name}`;
  const body =
    result?.object.body ??
    "Clara couldn't put today's briefing together — try again in a moment, or open My Actions to see what's outstanding.";
  const focus_item_keys = (result?.object.focus_item_keys ?? []).filter((k) => candidateKeys.has(k)).slice(0, 3);

  const row = { business_id: businessId, briefing_date: today, headline, body, focus_item_keys };
  const { data: saved, error } = await db
    .from("business_briefings")
    .upsert(row, { onConflict: "business_id,briefing_date" })
    .select("*")
    .single();
  if (error || !saved) throw new Error(error?.message ?? "Could not save today's briefing.");
  return saved as Briefing;
}
