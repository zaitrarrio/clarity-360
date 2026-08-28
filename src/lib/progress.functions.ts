import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveInput = z.object({
  mode: z.enum(["draft", "forks"]),
  seedName: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

const ReadInput = z.object({
  mode: z.enum(["draft", "forks"]),
  seedName: z.string().min(1),
});

export const savePlanProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("plan_progress").upsert(
      {
        user_id: context.userId,
        mode: data.mode,
        seed_name: data.seedName,
        payload: data.payload as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mode,seed_name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const readPlanProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("plan_progress")
      .select("payload, updated_at")
      .eq("user_id", context.userId)
      .eq("mode", data.mode)
      .eq("seed_name", data.seedName)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? { payload: row.payload as Record<string, unknown>, updatedAt: row.updated_at } : null;
  });

export const latestPlanProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ mode: z.enum(["draft", "forks"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("plan_progress")
      .select("payload, updated_at")
      .eq("user_id", context.userId)
      .eq("mode", data.mode)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    return row ? { payload: row.payload as Record<string, unknown>, updatedAt: row.updated_at } : null;
  });

export const clearPlanProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("plan_progress").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
