import { generateText } from "ai";
import { admin, gateway, CLARA_MODEL, loadPlanContext, planContextPrompt } from "./clarity.server";

type SectionRow = {
  id: string;
  domain_key: string;
  title: string;
  kicker: string | null;
  ordinal: number;
  summary: string | null;
  findings: unknown;
  decisions: unknown;
  metrics: unknown;
};

function stripFence(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

/** Store the current state of every plan report as a numbered version. */
export async function snapshotPlan(businessId: string, changeNote: string, summary: string) {
  const db = await admin();
  const { data: sections } = await db
    .from("plan_sections")
    .select("domain_key, title, kicker, ordinal, summary, findings, decisions, metrics")
    .eq("business_id", businessId)
    .order("ordinal");
  const { data: latest } = await db
    .from("plan_versions")
    .select("version")
    .eq("business_id", businessId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;
  await db.from("plan_versions").insert({
    business_id: businessId,
    version,
    change_note: changeNote,
    summary,
    sections: (sections ?? []) as unknown as Json,
  });
  return version;
}

/**
 * Apply a change to the operating plan: snapshot the plan as it stands, rewrite
 * every section so the whole plan stays consistent with the change, then store
 * the result as the next version.
 */
export async function revisePlan(businessId: string, change: string) {
  const db = await admin();
  const { data: rows } = await db
    .from("plan_sections")
    .select("id, domain_key, title, kicker, ordinal, summary, findings, decisions, metrics")
    .eq("business_id", businessId)
    .order("ordinal");
  const sections = (rows ?? []) as SectionRow[];
  if (!sections.length) return { ok: false, error: "This plan has no reports to revise yet." };

  const { data: existing } = await db
    .from("plan_versions")
    .select("id")
    .eq("business_id", businessId)
    .limit(1);
  if (!existing?.length) {
    await snapshotPlan(businessId, "Plan as first written", "Baseline before any revisions.");
  }

  const ctx = await loadPlanContext(businessId);
  const result = await generateText({
    model: gateway()(CLARA_MODEL),
    system: `You maintain a seven-domain operating plan for one business.
A change has been agreed with the owner. Rewrite the WHOLE plan so every report stays true and consistent with it.
Carry the change through to the reports it touches — numbers, decisions, findings and metrics must not contradict each other.
Leave a report unchanged when the change genuinely does not affect it.
Never invent external market statistics. Keep the existing voice: specific, plain, no filler.
Reply with JSON only, no prose and no code fence.`,
    prompt: `${planContextPrompt(ctx)}

CURRENT REPORTS (domain_key — title):
${sections.map((s) => `- ${s.domain_key} — ${s.title}`).join("\n")}

AGREED CHANGE:
${change}

Return JSON of this exact shape:
{
  "summary": "one sentence on what changed across the plan",
  "sections": [
    {
      "domain_key": "market",
      "summary": "the report's opening paragraph",
      "findings": ["..."],
      "decisions": ["..."],
      "metrics": [{ "label": "...", "value": "..." }]
    }
  ]
}
Include an entry for every domain_key listed above.`,
  });

  let parsed: {
    summary?: string;
    sections?: { domain_key: string; summary?: string; findings?: string[]; decisions?: string[]; metrics?: { label: string; value: string }[] }[];
  };
  try {
    parsed = JSON.parse(stripFence(result.text));
  } catch {
    return { ok: false, error: "The plan rewrite came back unreadable — nothing was changed." };
  }

  const updated: string[] = [];
  for (const next of parsed.sections ?? []) {
    const row = sections.find((s) => s.domain_key === next.domain_key);
    if (!row) continue;
    await db
      .from("plan_sections")
      .update({
        summary: next.summary ?? row.summary,
        findings: (next.findings ?? row.findings) as unknown as Json,
        decisions: (next.decisions ?? row.decisions) as unknown as Json,
        metrics: (next.metrics ?? row.metrics) as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    updated.push(row.title);
  }

  const version = await snapshotPlan(businessId, change, parsed.summary ?? "Plan updated.");
  return { ok: true, version, summary: parsed.summary ?? "Plan updated.", updated };
}
