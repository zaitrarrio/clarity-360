import { createFileRoute } from "@tanstack/react-router";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

export const Route = createFileRoute("/api/clara")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { assertBusinessAccess, admin } = await import("@/lib/clarity.server");
        const businessId = new URL(request.url).searchParams.get("businessId") ?? "";
        if (!businessId) return Response.json({ messages: [] }, { status: 400 });

        try {
          await assertBusinessAccess(businessId);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Forbidden", { status: 403 });
        }

        const db = await admin();
        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        const { data: userData } = token ? await db.auth.getUser(token) : { data: { user: null } };
        const userId = userData.user?.id;
        if (!userId) return Response.json({ messages: [] });

        const { data: conversation } = await db
          .from("conversations")
          .select("id")
          .eq("business_id", businessId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!conversation) return Response.json({ messages: [] });

        const { data: savedMessages, error } = await db
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conversation.id)
          .in("role", ["user", "assistant"])
          .order("created_at", { ascending: true })
          .limit(200);
        if (error) return new Response("Could not load Clara's history", { status: 500 });
        return Response.json({ messages: savedMessages ?? [] });
      },
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

        let business;
        try {
          business = await assertBusinessAccess(businessId);
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Forbidden", { status: 403 });
        }

        const db = await admin();
        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        const { data: userData } = token ? await db.auth.getUser(token) : { data: { user: null } };
        const userId = userData.user?.id;
        let conversationId: string | null = null;

        if (userId) {
          const { data: existingConversation } = await db
            .from("conversations")
            .select("id")
            .eq("business_id", businessId)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          conversationId = existingConversation?.id ?? null;
          if (!conversationId) {
            const { data: createdConversation } = await db
              .from("conversations")
              .insert({ business_id: businessId, user_id: userId, title: `Clara · ${business.name}` })
              .select("id")
              .single();
            conversationId = createdConversation?.id ?? null;
          }
          const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
          if (conversationId && latestUserMessage) {
            await db.from("messages").insert({
              conversation_id: conversationId,
              business_id: businessId,
              role: "user",
              content: latestUserMessage.content,
            });
          }
        }

        const ctx = await loadPlanContext(businessId);
        const { data: actions } = await db
          .from("actions")
          .select("action_key, title, description, kind, agent_key")
          .eq("business_id", businessId)
          .order("ordinal");
        const { data: readinessItems } = await db
          .from("business_readiness_items")
          .select("item_key, category, title, status, objective")
          .eq("business_id", businessId)
          .order("priority");

        const tools = {
          live_indicators: tool({
            description:
              "Fetch authoritative current economic, local-market, and industry indicators for this business. Call this before making claims about market size, employment, inflation, income, demand, or industry conditions.",
            inputSchema: z.object({
              focus: z.enum(["economic", "local_market", "industry", "all"]),
            }),
            execute: async () => {
              const { loadEconomicSnapshot } = await import("@/lib/economic-data.server");
              return loadEconomicSnapshot({ location: ctx.business.location, industry: ctx.business.industry });
            },
          }),
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
          revise_plan: tool({
            description:
              "Apply an agreed change to the operating plan. This saves the plan as a new version and rewrites every report so the whole plan stays consistent. Call this whenever the owner decides something that changes the plan — a new price, market, offer, target, constraint or direction. Describe the change fully in one paragraph.",
            inputSchema: z.object({ change: z.string().min(4) }),
            execute: async ({ change }) => {
              const { revisePlan } = await import("@/lib/plan-versions.server");
              return revisePlan(businessId, change);
            },
          }),
          review_readiness: tool({
            description:
              "Review the business readiness checklist (My Actions) against everything known about the business and sharpen or add to it. Call this when the conversation has surfaced something specific enough to make a checklist item more precise, or a genuinely new must-have the current list is missing — not on every message.",
            inputSchema: z.object({}),
            execute: async () => {
              const { refineReadinessItems } = await import("@/lib/readiness.server");
              const result = await refineReadinessItems(businessId);
              return result;
            },
          }),
        };

        const result = streamText({
          model: gateway()(CLARA_MODEL),
          system: `${CLARA_SYSTEM}

${planContextPrompt(ctx)}

AVAILABLE ACTIONS (action_key — title):
${(actions ?? []).map((a) => `- ${a.action_key} — ${a.title} (${a.kind})`).join("\n")}

READINESS CHECKLIST (My Actions — item_key [status] title, agent objective):
${(readinessItems ?? []).map((i) => `- ${i.item_key} [${i.status}] ${i.title}${i.objective ? ` — ${i.objective}` : ""}`).join("\n")}
When the conversation reveals something specific enough to sharpen an item or surfaces a genuinely
new must-have, call review_readiness rather than just describing it — that's what actually updates
the checklist the owner sees on My Actions.

CHANGES TO THE PLAN: when the owner decides something that changes the plan, call revise_plan with a full
description of the change. That saves a new version and refreshes every report. Never describe a plan change
as done without calling it, and never edit only one report in your head — the tool keeps the whole plan consistent.
After it returns, tell the owner the version number and which reports moved.
${body.section ? `\nThe owner is currently reading the "${body.section}" section of the plan.` : ""}

WHENEVER YOU ASK A MULTIPLE-CHOICE QUESTION: number the options and always end the list with a final numbered "Other — describe it in your own words" option. Accept a free-text answer that matches none of your options, take it at face value, and plan around it instead of pushing the owner back into your list.`,
          messages,
          tools,
          stopWhen: stepCountIs(50),
          abortSignal: request.signal,
          onFinish: async ({ text }) => {
            if (!conversationId) return;
            await db.from("messages").insert({
              conversation_id: conversationId,
              business_id: businessId,
              role: "assistant",
              content: text.trim() || "Done — check My Actions and My Agenda.",
            });
          },
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
