# Turn My Actions into the business readiness workspace

## Goal
Give every business a stage- and industry-aware checklist of must-haves, show what is done versus where help is needed, and make each missing item actionable. Move the current agent runner to **My Agents**.

## What will change
- Add signed-in **My workspace** and profile controls to the main marketing page and branded intro page.
- Move the existing agent run/schedule experience from `/actions` to `/agents` and rename it **My Agents** in workspace navigation.
- Rebuild `/actions` as **My Actions**, organized into practical categories such as Formation, Launch, Presence, Growth, Operations, Finance, and Risk.
- Tailor visible and prioritized requirements to the business stage and industry already stored in the operating plan.
- Let users mark each requirement as complete, not started, or needing help; save those choices to their account for cross-browser access.
- Show overall readiness and category progress so gaps are immediately clear.
- Add a clear assistance action for incomplete requirements and an integration boundary for service-specific fulfillment.

## Initial must-have framework
- **Formation:** legal entity, domain name, business email, website, social profiles.
- **Launch:** launch timeline, launch campaign, launch content, publicity, partnerships.
- **Operate:** payment collection, bookkeeping, customer process, delivery workflow, core compliance.
- **Grow:** acquisition channel, recurring content, referral/partner motion, measurement, retention.
- Requirements are filtered and prioritized by stage; industry-specific items augment this shared baseline.

## Service fulfillment
- Model fulfillment separately from checklist status so an action can open an in-app workflow, connect a supported service, or hand off externally.
- The currently active project skills do not include Bizee or a Stripe account-creation skill. The first release will expose those as clearly labeled help pathways without pretending an unavailable integration ran.
- The structure will allow Bizee and Stripe fulfillment to be attached when those skills are activated/configured.

## Technical details
- Add a `business_readiness_items` table with explicit authenticated/service grants, row-level access by business owner, timestamps, and one row per business/checklist key.
- Seed or upsert checklist items on first use from deterministic stage/industry definitions; never overwrite user-completed status.
- Add authenticated server functions for reading/upserting readiness and changing item status.
- Add `/agents` as a real route and update all typed workspace links.
- Preserve existing action runs, schedules, and outputs unchanged on the renamed agent page.
- Verify signed-in and signed-out marketing headers, readiness persistence, route navigation, and desktop/mobile layouts.
