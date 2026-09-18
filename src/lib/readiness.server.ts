import { generateObject } from "ai";
import { z } from "zod";
import { admin, gateway, CLARA_MODEL, loadPlanContext, planContextPrompt } from "./clarity.server";
import { defaultObjective, inferDomainKey, type ReadinessHelpKind, type ReadinessItem } from "./readiness";

const RefinedItem = z.object({
  item_key: z.string().describe("Existing item_key to sharpen. Must match one already listed."),
  description: z.string().max(240),
  objective: z.string().max(300),
});

const NewItem = z.object({
  item_key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{2,40}$/)
    .describe("New, short snake_case key. Must not collide with an existing item_key."),
  category: z.string().max(40),
  title: z.string().max(80),
  description: z.string().max(240),
  objective: z.string().max(300),
  priority: z.number().int().min(1).max(999),
  help_kind: z.enum(["clara", "agent", "integration", "guide"]),
  help_target: z.string().max(60).nullable(),
});

const ReadinessReview = z.object({
  refine: z.array(RefinedItem).max(6).describe("Existing items whose description/objective should get more specific now that more is known."),
  add: z.array(NewItem).max(4).describe("Genuinely new must-haves this specific business needs that the current list is missing."),
});

const REFINE_SYSTEM = `You are Clara's readiness-scout inside Clarity 360.
You hold one business's whole operating plan and its current must-have checklist.
Your job is narrow: as you learn more about this specific business, sharpen generic checklist
items into specific ones, and propose genuinely new must-haves the generic list is missing —
never remove or restate what's already specific enough, never invent facts not in the plan.

Rules:
- Only "refine" an item if you can make it materially more specific using real facts from the plan
  (a number, a name, a deadline, a regulation, a local fact) — not just reworded filler.
- Only "add" a new item if it is a concrete, distinct must-have this business needs at its stage
  and industry that nothing in the current list already covers.
- Every objective must be something an agent could actually go DO — seek information, draft
  something, compare options, produce an artifact — not a vague restatement of the title.
- help_kind "agent" means it runs autonomously on a schedule and must have a real, specific
  objective an LLM agent can execute with no other tools than reasoning and the plan's own data.
- help_kind "integration" means it needs a real external service/account.
- help_kind "guide" means it needs current, researchable real-world facts (an agent without live
  browsing should not claim certainty here — keep the objective about producing a short how-to).
- help_kind "clara" means it's a judgment call/draft the owner should review with her.
- Category should be one of: Formation, Launch, Operate, Grow, Industry — or a short new category
  name if none of those genuinely fit.
- Keep it tight: never propose more than 4 new items or refine more than 6 in one pass.
- If nothing genuinely new is warranted, return empty arrays. Don't invent work to look busy.`;

export type ReadinessReviewResult = { refined: number; added: number };

/**
 * Clara reviews everything known about this business — the operating plan,
 * signals, and the current checklist — and either sharpens existing items
 * or proposes new ones. This is what makes the list evolve instead of
 * staying a static, generic seed forever.
 */
export async function refineReadinessItems(businessId: string): Promise<ReadinessReviewResult> {
  const db = await admin();
  const [ctx, itemsRes] = await Promise.all([
    loadPlanContext(businessId),
    db
      .from("business_readiness_items")
      .select("item_key, category, title, description, status, help_kind, help_target, source")
      .eq("business_id", businessId),
  ]);
  const items = itemsRes.data ?? [];
  if (!items.length || !ctx.sections.length) return { refined: 0, added: 0 };

  const existingKeys = new Set(items.map((i) => i.item_key));
  const itemsBlock = items
    .map((i) => `- [${i.status}] ${i.item_key} (${i.category} · ${i.help_kind}): ${i.title} — ${i.description ?? ""}`)
    .join("\n");

  const result = await generateObject({
    model: gateway()(CLARA_MODEL),
    schema: ReadinessReview,
    system: REFINE_SYSTEM,
    prompt: `${planContextPrompt(ctx)}\n\nCURRENT CHECKLIST:\n${itemsBlock}\n\nReview the checklist against the plan above.`,
  }).catch(() => null);
  if (!result) return { refined: 0, added: 0 };

  const now = new Date().toISOString();
  let refined = 0;
  for (const r of result.object.refine) {
    if (!existingKeys.has(r.item_key)) continue;
    const { error } = await db
      .from("business_readiness_items")
      .update({ description: r.description, objective: r.objective, last_reviewed_at: now })
      .eq("business_id", businessId)
      .eq("item_key", r.item_key);
    if (!error) refined += 1;
  }

  let added = 0;
  for (const n of result.object.add) {
    if (existingKeys.has(n.item_key)) continue;
    const { error } = await db.from("business_readiness_items").insert({
      business_id: businessId,
      item_key: n.item_key,
      category: n.category,
      title: n.title,
      description: n.description,
      objective: n.objective,
      priority: n.priority,
      help_kind: n.help_kind,
      help_target: n.help_target,
      status: "not_started",
      source: "clara",
      last_reviewed_at: now,
    });
    if (!error) {
      added += 1;
      existingKeys.add(n.item_key);
      if (n.help_kind === "agent") {
        await ensureAgentAction(businessId, {
          item_key: n.item_key,
          category: n.category,
          title: n.title,
          objective: n.objective,
          help_target: n.help_target,
        });
      }
    }
  }

  await db
    .from("business_readiness_items")
    .update({ last_reviewed_at: now })
    .eq("business_id", businessId)
    .is("last_reviewed_at", null);

  return { refined, added };
}

/**
 * Bridges a help_kind="agent" readiness item into the real execution engine
 * (actions + agent_schedules) so it actually runs autonomously instead of
 * sitting on the checklist as an inert label. Idempotent — safe to call for
 * items that already have a matching action.
 */
export async function ensureAgentAction(
  businessId: string,
  item: { item_key: string; category: string; title: string; objective: string; help_target: string | null },
): Promise<void> {
  const db = await admin();
  const actionKey = item.help_target && /^[a-z][a-z0-9_]*$/.test(item.help_target) ? item.help_target : item.item_key;
  const domain = inferDomainKey(item.category, item.title);

  const { data: existing } = await db
    .from("actions")
    .select("id")
    .eq("business_id", businessId)
    .eq("action_key", actionKey)
    .maybeSingle();

  let actionId = existing?.id as string | undefined;
  if (!actionId) {
    const { data: created } = await db
      .from("actions")
      .insert({
        business_id: businessId,
        domain_key: domain,
        action_key: actionKey,
        title: item.title,
        description: item.objective,
        kind: "recurring",
        agent_key: domain,
        ordinal: 900,
      })
      .select("id")
      .single();
    actionId = created?.id;
  }
  if (!actionId) return;

  const { data: schedule } = await db
    .from("agent_schedules")
    .select("id")
    .eq("business_id", businessId)
    .eq("action_key", actionKey)
    .maybeSingle();
  if (!schedule) {
    await db.from("agent_schedules").insert({
      business_id: businessId,
      action_id: actionId,
      action_key: actionKey,
      agent_key: domain,
      cadence: "weekly",
      next_run_at: new Date(Date.now() + 3600_000).toISOString(),
      active: true,
    });
  }
}

/**
 * Called the first time a business's readiness list is seeded, so the
 * baseline template's agent-kind items (website, delivery_workflow, core
 * compliance, content rhythm, …) are wired into the execution engine even
 * before Clara has ever run a refine pass. Safe to call repeatedly.
 */
export async function ensureAgentActionsForItems(
  businessId: string,
  items: Pick<ReadinessItem, "item_key" | "category" | "title" | "objective" | "help_kind" | "help_target">[],
): Promise<void> {
  const agentItems = items.filter((i) => i.help_kind === ("agent" as ReadinessHelpKind));
  for (const item of agentItems) {
    await ensureAgentAction(businessId, {
      item_key: item.item_key,
      category: item.category,
      title: item.title,
      objective: item.objective ?? defaultObjective(item.help_kind, item.title),
      help_target: item.help_target,
    });
  }
}
