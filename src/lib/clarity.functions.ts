import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RunInput = z.object({ businessId: z.string().uuid(), actionKey: z.string().min(1) });
const SignalInput = z.object({ signalId: z.string().uuid(), status: z.enum(["new", "acknowledged", "dismissed"]) });
const ScheduleInput = z.object({ scheduleId: z.string().uuid(), active: z.boolean() });
const ScheduleCreateInput = z.object({
  businessId: z.string().uuid(),
  actionKey: z.string().min(1),
  cadence: z.enum(["on_demand", "daily", "weekly", "monthly"]),
});
const IntakeInput = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  answers: z.array(z.object({ key: z.string(), stage: z.string(), question: z.string(), answer: z.string() })),
});

export const runAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RunInput.parse(d))
  .handler(async ({ data }) => {
    const { assertBusinessAccess, admin, generateArtifact, ACTION_INSTRUCTIONS } = await import("./clarity.server");
    await assertBusinessAccess(data.businessId);
    const db = await admin();

    const { data: action } = await db
      .from("actions")
      .select("id, action_key, title, agent_key, description")
      .eq("business_id", data.businessId)
      .eq("action_key", data.actionKey)
      .maybeSingle();
    if (!action) throw new Error("Unknown action");

    const { data: run } = await db
      .from("action_runs")
      .insert({
        business_id: data.businessId,
        action_id: action.id,
        action_key: action.action_key,
        title: action.title,
        agent_key: action.agent_key,
        status: "running",
      })
      .select("id")
      .single();

    try {
      const artifact = await generateArtifact({
        businessId: data.businessId,
        actionKey: action.action_key,
        title: action.title,
        agentKey: action.agent_key,
        instruction: ACTION_INSTRUCTIONS[action.action_key] ?? action.description ?? action.title,
      });
      await db
        .from("action_runs")
        .update({
          status: "complete",
          artifact_title: artifact.artifactTitle,
          artifact_body: artifact.artifactBody,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run!.id);
      return { runId: run!.id, status: "complete" as const, ...artifact };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      await db
        .from("action_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", run!.id);
      throw new Error(message);
    }
  });

export const setSignalStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SignalInput.parse(d))
  .handler(async ({ data }) => {
    const { assertBusinessAccess, admin } = await import("./clarity.server");
    const db = await admin();
    const { data: signal } = await db.from("signals").select("id, business_id").eq("id", data.signalId).maybeSingle();
    if (!signal) throw new Error("Signal not found");
    await assertBusinessAccess(signal.business_id);
    await db.from("signals").update({ status: data.status }).eq("id", data.signalId);
    return { ok: true };
  });

export const setScheduleActive = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScheduleInput.parse(d))
  .handler(async ({ data }) => {
    const { assertBusinessAccess, admin } = await import("./clarity.server");
    const db = await admin();
    const { data: row } = await db
      .from("agent_schedules")
      .select("id, business_id")
      .eq("id", data.scheduleId)
      .maybeSingle();
    if (!row) throw new Error("Schedule not found");
    await assertBusinessAccess(row.business_id);
    await db.from("agent_schedules").update({ active: data.active }).eq("id", data.scheduleId);
    return { ok: true };
  });

export const scheduleAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScheduleCreateInput.parse(d))
  .handler(async ({ data }) => {
    const { assertBusinessAccess, admin } = await import("./clarity.server");
    await assertBusinessAccess(data.businessId);
    const db = await admin();
    const { data: action } = await db
      .from("actions")
      .select("id, action_key, agent_key")
      .eq("business_id", data.businessId)
      .eq("action_key", data.actionKey)
      .maybeSingle();
    if (!action) throw new Error("Unknown action");
    const onDemand = data.cadence === "on_demand";
    const hours = data.cadence === "daily" ? 24 : data.cadence === "weekly" ? 168 : 720;
    const next = new Date(Date.now() + hours * 3600_000).toISOString();
    const { data: existing } = await db
      .from("agent_schedules")
      .select("id")
      .eq("business_id", data.businessId)
      .eq("action_key", data.actionKey)
      .maybeSingle();
    if (existing) {
      await db
        .from("agent_schedules")
        .update(
          onDemand
            ? { active: false }
            : { cadence: data.cadence, next_run_at: next, active: true },
        )
        .eq("id", existing.id);
    } else {
      await db.from("agent_schedules").insert({
        business_id: data.businessId,
        action_id: action.id,
        action_key: action.action_key,
        agent_key: action.agent_key,
        cadence: onDemand ? "daily" : data.cadence,
        next_run_at: next,
        active: !onDemand,
      });
    }
    return { ok: true };
  });

export const buildPlanFromIntake = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IntakeInput.parse(d))
  .handler(async ({ data }) => {
    const { buildPlan } = await import("./intake.server");
    return buildPlan(data);
  });
