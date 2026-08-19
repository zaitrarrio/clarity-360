# Clarity 360 — Growth OS (first build)

A full working skeleton of the product: public site → intake → a living operating plan → Clara, the agent that makes the plan actionable. Seeded with one realistic demo business so every screen is populated on first load, but the plan, actions, and Clara are real and persist.

## The experience

**1. Marketing site (`/`)**
Warm cream canvas (#FAFAF8 / #EFEBE4), Cormorant Garamond display serif, DM Sans body, DM Mono for labels, ember orange #E8572A accents — the Clarity 360 identity from your docs. Hero ("You know your trade…"), how it works, the seven reports, pricing, and a single "Get started" path into intake.

**2. Intake (`/intake`)**
A conversational, staged intake — ten core questions plus the reconciliation decisions that are genuinely specific to the business and industry (the choices that change what the plan *is*, not just fill it in). Progress rail across stages, Clara narrating alongside. On submit, Clara generates the plan.

**3. The operating plan (`/plan`)**
The centerpiece. Seven report domains rendered as living sections rather than a static document:
- Each domain shows findings, decisions, and a set of **actions**.
- Every action has a state (available / running / scheduled / done) and produces an artifact or a tracked outcome.
- Left rail navigates domains; right rail is Clara, always present and context-aware of the section you're reading.

**4. Actions (`/actions`)**
The catalog and history of everything the plan can *do* — one-shot builders (pitch deck, website copy, prototype brief, brand kit) and recurring operators (daily post, weekly metrics review, competitor price watch). Each run shows status, output artifact, and which agent produced it.

**5. Agenda & signals (`/agenda`)**
The proactive surface. A daily agenda Clara assembles, plus an event feed where domain agents push insights as they happen ("Competitor X dropped below your price", "Your funnel stalled at step 3"). Items are dismissible, snoozable, and convert into actions.

**6. Clara**
One central agent with a real model behind her, plus domain agents (Market, Offer, Growth, Ops, Finance, Brand, Risk). Clara chats with full plan context, streams her thinking, and calls real tools: read/update plan sections, run an action, schedule a recurring agent, generate an artifact, log a signal. Tools that spend money or change the plan ask for confirmation first.

## Technical outline

- **Backend:** Lovable Cloud enabled — email/password auth, Postgres with RLS scoped to `auth.uid()`, storage for generated artifacts.
- **Schema:** `businesses`, `intake_responses`, `plan_sections`, `actions` (definition), `action_runs` (execution + artifact), `agents`, `agent_schedules`, `signals`, `conversations`, `messages`. Every table gets explicit grants + RLS.
- **Seed:** the demo business ("Little Live Oak") and a complete seven-domain plan ship as literal INSERTs in the migration, so `/plan` is full immediately.
- **AI:** Lovable AI Gateway via the AI SDK. Clara streams from a chat server route with tool calling and reasoning shown in the UI; one-shot generators (plan build, pitch deck, daily post) run as server functions that stream internally.
- **Scheduling:** recurring agents write to `agent_schedules`; a public cron endpoint under `/api/public/` runs due jobs, writes `signals`, and feeds the agenda.
- **Frontend:** TanStack Start routes, design tokens in `src/styles.css` (no hardcoded colors), fonts loaded via `<link>` in `__root.tsx`.

## Scope notes

- Artifact generation produces real content (markdown/HTML documents, deck outlines) rather than binary exports in this pass.
- Competitor price watch runs on model-generated estimates until you connect a real data source.
- Mobile gets a working responsive layout; the plan workspace is designed desktop-first.

## Build order

1. Enable Cloud, migration + seed, design tokens and shell.
2. Marketing site and intake flow.
3. Plan workspace with Clara chat and tool calling.
4. Actions catalog, runs, and artifacts.
5. Agenda, signals, scheduled agents, cron endpoint.
