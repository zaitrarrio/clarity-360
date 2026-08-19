import { createFileRoute } from "@tanstack/react-router";

/**
 * Runs every due agent schedule: executes the action, stores the artifact and
 * raises a signal so the result shows up on the owner's agenda.
 * Called by the platform scheduler; auth is the project apikey header.
 */
export const Route = createFileRoute("/api/public/agents-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env["SUPABASE_PUBLISHABLE_KEY"]) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { admin, generateArtifact, ACTION_INSTRUCTIONS } = await import("@/lib/clarity.server");
        const db = await admin();
        const now = new Date();

        const { data: due } = await db
          .from("agent_schedules")
          .select("id, business_id, action_key, agent_key, cadence")
          .eq("active", true)
          .lte("next_run_at", now.toISOString())
          .limit(10);

        const results: { action_key: string; status: string }[] = [];

        for (const schedule of due ?? []) {
          const { data: action } = await db
            .from("actions")
            .select("id, title, description, domain_key")
            .eq("business_id", schedule.business_id)
            .eq("action_key", schedule.action_key)
            .maybeSingle();

          const { data: run } = await db
            .from("action_runs")
            .insert({
              business_id: schedule.business_id,
              action_id: action?.id ?? null,
              action_key: schedule.action_key,
              title: action?.title ?? schedule.action_key,
              agent_key: schedule.agent_key,
              status: "running",
            })
            .select("id")
            .single();

          try {
            const artifact = await generateArtifact({
              businessId: schedule.business_id,
              actionKey: schedule.action_key,
              title: action?.title ?? schedule.action_key,
              agentKey: schedule.agent_key,
              instruction: ACTION_INSTRUCTIONS[schedule.action_key] ?? action?.description ?? schedule.action_key,
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
            await db.from("signals").insert({
              business_id: schedule.business_id,
              agent_key: schedule.agent_key,
              domain_key: action?.domain_key ?? null,
              severity: "info",
              title: `${action?.title ?? schedule.action_key} ran automatically`,
              body: artifact.artifactBody.slice(0, 400),
              suggested_action_key: schedule.action_key,
              status: "new",
            });
            results.push({ action_key: schedule.action_key, status: "complete" });
          } catch (error) {
            const message = error instanceof Error ? error.message : "failed";
            await db
              .from("action_runs")
              .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
              .eq("id", run!.id);
            results.push({ action_key: schedule.action_key, status: "failed" });
          }

          const hours = schedule.cadence === "daily" ? 24 : schedule.cadence === "weekly" ? 168 : 720;
          await db
            .from("agent_schedules")
            .update({
              last_run_at: now.toISOString(),
              next_run_at: new Date(now.getTime() + hours * 3600_000).toISOString(),
            })
            .eq("id", schedule.id);
        }

        return new Response(JSON.stringify({ ran: results.length, results }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
