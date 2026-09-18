import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Briefing } from "./briefing";

const BusinessInput = z.object({ businessId: z.string().uuid() });

async function assertOwner(businessId: string, userId: string, supabase: SupabaseClient<Database>) {
  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !business) throw new Error("Business not found");
}

/** Loads today's briefing, generating it on first visit of the day if it doesn't exist yet. */
export const getTodayBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BusinessInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(data.businessId, context.userId, context.supabase);
    const { generateDailyBriefing } = await import("./briefing.server");
    return (await generateDailyBriefing(data.businessId)) as Briefing;
  });

/** Owner-triggered "give me a fresh read" — regenerates even if today's briefing already exists. */
export const regenerateBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BusinessInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(data.businessId, context.userId, context.supabase);
    const { generateDailyBriefing } = await import("./briefing.server");
    return (await generateDailyBriefing(data.businessId, { force: true })) as Briefing;
  });
