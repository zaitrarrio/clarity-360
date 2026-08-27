import { streamText } from "ai";
import { gateway, CLARA_MODEL } from "./clarity.server";
import { industryByKey, marketLines, type Seed } from "./industries";

export type * from "./onboarding.types";

import type { Correction, Decision, DraftRound, ForkRound } from "./onboarding.types";

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Clara's answer came back unreadable. Try again.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

async function complete(system: string, prompt: string): Promise<string> {
  const result = streamText({ model: gateway()(CLARA_MODEL), system, prompt });
  return result.text;
}

/** Models occasionally emit malformed JSON; one retry with a stricter nudge fixes nearly all of it. */
async function completeJson<T>(system: string, prompt: string): Promise<T> {
  try {
    return extractJson<T>(await complete(system, prompt));
  } catch {
    const retry = await complete(
      system,
      `${prompt}\n\nYour previous answer was not parseable JSON. Return the object again, strictly valid: double-quoted keys, escaped inner quotes, no trailing commas, no markdown.`,
    );
    return extractJson<T>(retry);
  }
}

function seedBlock(seed: Seed): string {
  const industry = industryByKey(seed.industryKey);
  return `Business name: ${seed.name}
Stage: ${seed.stage}
Category: ${industry?.label ?? "General"}
Subcategory: ${seed.subcategory || "unspecified"}
Where: ${seed.location}
Website: ${seed.website || "none given"}
Objective: ${seed.objective}

Specialisation axes that must be pinned down for this category before the plan is specific:
${(industry?.axes ?? []).map((a) => `- ${a}`).join("\n")}`;
}

const SHARED_RULES = `You are Clara, the analyst behind Clarity 360. You specialise a seven-section operating plan
(Strategic, Customer & Product, Market Execution, Financial, Operational, Governance, Execution & Launch)
to one specific business.

You already know industry norms. Never ask about anything a competent analyst could assume from the category,
the stage and the location. Only surface what is SPECIALISED to this business relative to its industry norms —
the parameters where this business could plausibly differ from the standard, and where the difference changes
what the plan IS rather than just re-weighting it.

"coverage" is your honest projection of how much of the seven-section plan you could now write to a
load-bearing standard, 0-100. Start around 55-70 for a typical seed, rise as answers land, and only pass 90
when the remaining unknowns genuinely would not change the plan. Never jump more than about 15 points a round.

Everything you write is concrete: real numbers, real local comparables, real programme and licence names.
Return ONLY one valid JSON object. No prose, no code fences, no trailing commas, no comments.
Every string must be plain text on a single line with any internal double quotes escaped — prefer single quotes inside strings.`;

export async function draftRound(input: { seed: Seed; corrections: Correction[] }): Promise<DraftRound> {
  const { seed, corrections } = input;
  const history = corrections.length
    ? corrections
        .map((c) => `- ${c.where}: assumed "${c.assumed}" → they said "${c.choice}"`)
        .join("\n")
    : "None yet — this is the first pass.";

  const parsed = await completeJson<DraftRound>(
    `${SHARED_RULES}

APPROACH: "We draft, you correct." You have already drafted the whole plan. You now show the founder the
assumptions you had to make that actually move the plan, and let them put you right.`,
    `${seedBlock(seed)}

Corrections they have already made:
${history}

Return JSON:
{"coverage": <0-100>,
 "headline": "one sentence in Clara's voice about this pass, naming the business or its category",
 "note": "one or two sentences about which guesses matter and which do not",
 "flags": [
   {"id":"kebab-id","tag":"The big one|Assumed|Placeholder","where":"Report 0N · short section name",
    "assumed":"the specific thing you assumed, with numbers",
    "why":"why you assumed it and what would change if it is wrong",
    "fixes":[{"key":"short-key","label":"what they'd click, phrased as their own words","result":"what changes in the plan if they pick this — name the reports affected"}]}
 ],
 "ripple": [{"name":"Report 0N · name","note":"what their corrections have already changed here, or empty string"}]}

Give exactly 3 flags this round, ordered most load-bearing first, each with 2-3 fixes.
Do not repeat any assumption they have already corrected. Give 4-7 ripple entries.`,
  );

  return {
    coverage: Math.max(0, Math.min(100, Math.round(parsed.coverage ?? 60))),
    headline: parsed.headline ?? "Here is a first pass.",
    note: parsed.note ?? "",
    flags: (parsed.flags ?? []).slice(0, 3),
    ripple: (parsed.ripple ?? []).slice(0, 7),
  };
}

export async function forkRound(input: { seed: Seed; decisions: Decision[] }): Promise<ForkRound> {
  const { seed, decisions } = input;
  const history = decisions.length
    ? decisions.map((d) => `- ${d.question} → ${d.choice}`).join("\n")
    : "None yet — this is the first decision.";

  const parsed = await completeJson<ForkRound>(
    `${SHARED_RULES}

APPROACH: "Discover your plan." You put the founder in front of genuine forks — binary decisions where both
roads are defensible and the plan is materially different either way. Never ask for data you could look up or
infer; ask only for choices only they can make.`,
    `${seedBlock(seed)}

Decisions already made:
${history}

Return JSON:
{"coverage": <0-100>,
 "headline": "one sentence in Clara's voice about where the plan stands",
 "forks": [
   {"id":"kebab-id","kicker":"Route to market|Sourcing|Capacity|Pricing|…",
    "question":"a binary question, under 70 characters",
    "why":"two sentences on why this is theirs to decide and what it drives",
     "options":[
       {"key":"a","label":"short label","tail":"one sentence on what this road looks like in practice",
        "effects":[{"sign":"+","text":"a specific consequence, naming a report where useful"}]},
       {"key":"b","label":"the other road","tail":"one sentence","effects":[{"sign":"!","text":"a specific consequence"}]}
     ]}
 ],
 "inferred": [{"k":"parameter","v":"what you have inferred","why":"which answer let you infer it"}]}

Give exactly 2 forks this round, each with exactly 2 options and 3-4 effects per option.
Never repeat a decision already made; build on them. Give 0-3 inferred entries.`,
  );

  return {
    coverage: Math.max(0, Math.min(100, Math.round(parsed.coverage ?? 60))),
    headline: parsed.headline ?? "",
    forks: (parsed.forks ?? []).slice(0, 2),
    inferred: (parsed.inferred ?? []).slice(0, 3),
  };
}
