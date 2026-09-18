import { createFileRoute } from "@tanstack/react-router";

/**
 * Runs once per business per day: refreshes the readiness checklist with
 * Clara when it's gone stale (so it evolves instead of staying a static
 * seed), then generates that business's daily briefing. Called by the
 * platform scheduler; auth is the project apikey header, same as
 * agents-tick.
 */
export const Route = createFileRoute("/api/public/briefing-tick")({
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

        const { admin } = await import("@/lib/clarity.server");
        const { generateDailyBriefing } = await import("@/lib/briefing.server");
        const { refineReadinessItems } = await import("@/lib/readiness.server");
        const db = await admin();
        const today = new Date().toISOString().slice(0, 10);
        const staleCutoff = new Date(Date.now() - 3 * 24 * 3600_000).toISOString();

        const { data: businesses } = await db
          .from("businesses")
          .select("id")
          .eq("is_demo", false)
          .not("user_id", "is", null)
          .limit(25);

        const results: { business_id: string; refined: boolean; briefed: boolean }[] = [];

        for (const business of businesses ?? []) {
          let refined = false;
          try {
            const { data: staleItem } = await db
              .from("business_readiness_items")
              .select("id")
              .eq("business_id", business.id)
              .neq("status", "complete")
              .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${staleCutoff}`)
              .limit(1)
              .maybeSingle();
            if (staleItem) {
              await refineReadinessItems(business.id);
              refined = true;
            }
          } catch {
            // A failed refine pass should never block today's briefing.
          }

          let briefed = false;
          try {
            const { data: existing } = await db
              .from("business_briefings")
              .select("id")
              .eq("business_id", business.id)
              .eq("briefing_date", today)
              .maybeSingle();
            if (!existing) {
              await generateDailyBriefing(business.id);
              briefed = true;
            }
          } catch {
            // Isolate failures per business so one bad plan doesn't stall the batch.
          }

          results.push({ business_id: business.id, refined, briefed });
        }

        return new Response(JSON.stringify({ ran: results.length, results }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
