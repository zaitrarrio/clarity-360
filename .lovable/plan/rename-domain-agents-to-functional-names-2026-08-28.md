# Rename domain agents to functional names

Replace the codenames with functional names, keeping the stable `agent_key` values (market, offer, growth, operations, finance, brand, risk) unchanged so actions, runs, schedules, and signals keep working.

## Renames

| Domain | Old | New |
|---|---|---|
| market | Scout | Market Agent |
| offer | Ledgerline | Offer Agent |
| growth | Current | Growth Agent |
| operations | Keel | Operations Agent |
| finance | Tally | Finance Agent — **inactive until finance tools are connected** |
| brand | Ember | Messaging Agent |
| risk | Warden | Risk Agent |

Clara keeps her name.

## Changes

1. **`src/lib/clarity.ts`** — update `DOMAINS[].agent` and `AGENT_NAMES` with the new names.
2. **Database** — new migration: `UPDATE public.agents SET name=...` for the seven demo rows; set the Finance Agent row to `status = 'inactive'` with a description noting it activates when finance tools are connected. Also update any other seeded rows (signals/action_runs narratives) that quote the old codenames.
3. **`src/routes/index.tsx`** — rewrite the landing copy line that name-drops Scout/Tally/Warden to use the new functional names.
4. **UI for inactive Finance Agent** — where the agents list renders (plan/agenda/actions surfaces that show agent status), an `inactive` agent shows as "Inactive — activates when finance tools are connected" and its recurring actions can't be scheduled until then.

## Verification

- Build passes, old names no longer appear anywhere in the UI.
- Agents list shows the new names, Finance Agent shows inactive.
