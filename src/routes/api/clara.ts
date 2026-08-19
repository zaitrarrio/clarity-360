import { createFileRoute } from "@tanstack/react-router";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

export const Route = createFileRoute("/api/clara")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const {
          gateway,
          CLARA_MODEL,
          CLARA_SYSTEM,
          loadPlanContext,
          planContextPrompt,
          assertBusinessAccess,
          admin,
          generateArtifact,
          ACTION_INSTRUCTIONS,
        } = await import("@/lib/clarity.server");

        const body = (await request.json()) as {
          businessId?: string;
          section?: string | null;
          messages?: { role: "user" | "assistant"; content: string }[];
        };
        const businessId = body.businessId ?? "";
        const messages = (body.messages ?? []).slice(-16);
        if (!businessId || messages.length === 0) {
          return new Response("Bad request", { status: 400 });
        }

        try {
          await assertBusinessAccess(businessId);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Forbidden", { status: 403 });
        }

        const db = await admin();
        const ctx = await loadPlanContext(businessId);
        const { data: actions } = await db
          .from("actions")
          .select("action_key, title, description, kind, agent_key")
          .eq("business_id", businessId)
          .order("ordinal");

        const tools = {
          run_action: tool({
            description:
              "Run one of the plan's actions now. The domain agent produces a real artifact (post, deck, brief, scan). Use this whenever the user asks for the thing to be made.",
            inputSchema: z.object({ action_key: z.string() }),
            execute: async ({ action_key }) => {
              const action = (actions ?? []).find((a) => a.action_key === action_key);
              if (!action) return { ok: false, error: `No action called ${action_key}` };
              const { data: run } = await db
                .from("action_runs")
                .insert({
                  business_id: businessId,
                  action_key: action.action_key,
                  title: action.title,
                  agent_key: action.agent_key,
                  status: "running",
                })
                .select("id")
                .single();
              const artifact = await generateArtifact({
                businessId,
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
              return { ok: true, title: artifact.artifactTitle, body: artifact.artifactBody.slice(0, 1400) };
            },
          }),
          schedule_action: tool({
            description: "Put a recurring action on a schedule so its agent runs it automatically.",
            inputSchema: z.object({
              action_key: z.string(),
              cadence: z.enum(["daily", "weekly", "monthly"]),
            }),
            execute: async ({ action_key, cadence }) => {
              const action = (actions ?? []).find((a) => a.action_key === action_key);
              if (!action) return { ok: false, error: `No action called ${action_key}` };
              const hours = cadence === "daily" ? 24 : cadence === "weekly" ? 168 : 720;
              await db.from("agent_schedules").upsert(
                {
                  business_id: businessId,
                  action_key,
                  agent_key: action.agent_key,
                  cadence,
                  next_run_at: new Date(Date.now() + hours * 3600_000).toISOString(),
                  active: true,
                },
                { onConflict: "id" },
              );
              return { ok: true, cadence };
            },
          }),
          raise_signal: tool({
            description: "Record a proactive insight on the agenda so the owner sees it later.",
            inputSchema: z.object({
              title: z.string(),
              body: z.string(),
              severity: z.enum(["info", "warning", "alert"]),
              domain_key: z.string().nullable(),
            }),
            execute: async ({ title, body: text, severity, domain_key }) => {
              await db.from("signals").insert({
                business_id: businessId,
                agent_key: "clara",
                domain_key,
                severity,
                title,
                body: text,
                status: "new",
              });
              return { ok: true };
            },
          }),
        };

        const result = streamText({
          model: gateway()(CLARA_MODEL),
          system: `${CLARA_SYSTEM}

${planContextPrompt(ctx)}

AVAILABLE ACTIONS (action_key — title):
${(actions ?? []).map((a) => `- ${a.action_key} — ${a.title} (${a.kind})`).join("\n")}
${body.section ? `\nThe owner is currently reading the "${body.section}" section of the plan.` : ""}`,
          messages,
          tools,
          stopWhen: stepCountIs(50),
          abortSignal: request.signal,
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
