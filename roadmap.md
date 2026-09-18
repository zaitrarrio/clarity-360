# Roadmap

- [x] Show My workspace and the profile menu on signed-in marketing-page headers.
- [x] Rename the current My Actions agent scheduling page to My Agents.
- [x] Build My Actions as a stage- and industry-aware readiness checklist.
- [x] Let users mark completed work and identify where they need help.
- [ ] Connect legal-entity formation to a verified Bizee fulfillment service. Blocked: no Bizee skill or connector is currently available.
- [ ] Connect payment collection to a real payment onboarding and fulfillment flow.
- [x] Verify navigation, signed-in states, checklist persistence, and responsive layouts.
- [x] Replace the signed-out header logo with a hamburger menu for site navigation.
- [x] Let Clara sharpen and extend the readiness checklist as she learns more about the business, instead of a static seed (`readiness.server.ts` refineReadinessItems, `review_readiness` Clara tool, "Refresh with Clara" on My Actions).
- [x] Give agent-kind readiness items a real, agent-executable objective and wire them into the existing actions/agent_schedules engine so they run autonomously (`ensureAgentAction`).
- [x] Add My Briefing: a daily, plan-grounded summary with 1-3 spotlighted readiness items, generated once per business per day.
- [x] Scheduled `/api/public/agents-tick` (hourly, `clarity-agents-tick`) and `/api/public/briefing-tick` (daily 11:00 UTC / 6am Central, `clarity-briefing-tick`) via pg_cron + pg_net against the stable project URL; both verified end-to-end.
- [x] Clara saves every agreed plan change as a new version and refreshes all seven reports (`plan_versions`, `revise_plan` tool, plan history dialog).
- [ ] Add Runway (media), Outstand (social), Apollo (leads) and Lovable (websites/apps) integrations — awaiting the user's answers on keys and Apollo connection.
