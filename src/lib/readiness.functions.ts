import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readinessTemplates, type ReadinessItem } from "./readiness";

const BusinessInput = z.object({ businessId: z.string().uuid() });
const StatusInput = z.object({
  businessId: z.string().uuid(),
  itemKey: z.string().min(1),
  status: z.enum(["not_started", "needs_help", "complete"]),
});

export const getReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BusinessInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: business, error: businessError } = await context.supabase
      .from("businesses")
      .select("id, stage, industry")
      .eq("id", data.businessId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (businessError || !business) throw new Error("Business not found");

    const templates = readinessTemplates(business);
    const { error: seedError } = await context.supabase.from("business_readiness_items").upsert(
      templates.map((item) => ({ business_id: data.businessId, source: "template", ...item })),
      { onConflict: "business_id,item_key", ignoreDuplicates: true },
    );
    if (seedError) throw new Error(seedError.message);

    const { data: items, error } = await context.supabase
      .from("business_readiness_items")
      .select("*")
      .eq("business_id", data.businessId)
      .order("priority")
      .order("category");
    if (error) throw new Error(error.message);

    // Wire the baseline template's agent-kind items into the real execution
    // engine (actions + agent_schedules) the first time they're seen — safe
    // to call repeatedly, it no-ops once an action already exists.
    const { ensureAgentActionsForItems } = await import("./readiness.server");
    void ensureAgentActionsForItems(data.businessId, (items ?? []) as ReadinessItem[]);

    return (items ?? []) as ReadinessItem[];
  });

/**
 * Clara reviews everything known about this business and either sharpens
 * existing checklist items or proposes new ones — this is what keeps the
 * list from staying a static, generic seed forever.
 */
export const refreshReadinessWithClara = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BusinessInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: business, error } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("id", data.businessId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !business) throw new Error("Business not found");

    const { refineReadinessItems } = await import("./readiness.server");
    const result = await refineReadinessItems(data.businessId);

    const { data: items, error: itemsError } = await context.supabase
      .from("business_readiness_items")
      .select("*")
      .eq("business_id", data.businessId)
      .order("priority")
      .order("category");
    if (itemsError) throw new Error(itemsError.message);
    return { ...result, items: (items ?? []) as ReadinessItem[] };
  });

export const setReadinessStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: business } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("id", data.businessId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!business) throw new Error("Business not found");

    const { error } = await context.supabase
      .from("business_readiness_items")
      .update({ status: data.status })
      .eq("business_id", data.businessId)
      .eq("item_key", data.itemKey);
    if (error) throw new Error(error.message);
    return { ok: true };
  });