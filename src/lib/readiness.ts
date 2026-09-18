import type { Business, DomainKey } from "./clarity";

export type ReadinessStatus = "not_started" | "needs_help" | "complete";
export type ReadinessHelpKind = "clara" | "agent" | "integration" | "guide";
export type ReadinessSource = "template" | "clara";

export type ReadinessItem = {
  id: string;
  business_id: string;
  item_key: string;
  category: string;
  title: string;
  description: string | null;
  status: ReadinessStatus;
  priority: number;
  help_kind: ReadinessHelpKind;
  help_target: string | null;
  /** What an agent should actually go do about this — the proactive goal, not just the checklist label. */
  objective: string | null;
  /** "template" = shipped with the app; "clara" = she proposed or sharpened this from what she's learned. */
  source: ReadinessSource;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadinessTemplate = Omit<
  ReadinessItem,
  "id" | "business_id" | "status" | "source" | "last_reviewed_at" | "created_at" | "updated_at"
>;

/**
 * Every readiness item's help_kind implies a default proactive objective —
 * what an agent should be trying to do about it, not just what the checklist
 * label says. Clara can overwrite this per-item as she learns the business
 * (see readiness.server.ts refineReadinessItems); this is only the fallback
 * so nothing ships with an empty objective.
 */
export function defaultObjective(help_kind: ReadinessHelpKind, title: string): string {
  switch (help_kind) {
    case "agent":
      return `Work this autonomously on a schedule and produce a usable result for: ${title}.`;
    case "integration":
      return `Identify the best-fit service for "${title}", and prepare what the owner needs to connect it.`;
    case "guide":
      return `Research the concrete, current steps and local options for "${title}", then hand back a short how-to.`;
    case "clara":
    default:
      return `Draft a first, specific version of "${title}" for the owner to review and approve.`;
  }
}

/**
 * Readiness items don't carry a domain_key the way plan sections and actions
 * do — Clara-discovered items only have a free-text category. This maps a
 * category (and, as a fallback, the title) onto one of the seven domain
 * agents so a new agent-kind item can be wired into the same actions /
 * agent_schedules engine the rest of the product already runs on.
 */
export function inferDomainKey(category: string, title = ""): DomainKey {
  const text = `${category} ${title}`.toLowerCase();
  if (/(formation|legal|entity|license|permit|compliance|insurance|risk)/.test(text)) return "risk";
  if (/(finance|cash|payment|bookkeep|invoice|funding|pricing)/.test(text)) return "finance";
  if (/(launch|grow|acquisition|content|publicity|partner|referral|campaign|market)/.test(text)) return "growth";
  if (/(brand|story|message|website|social|post)/.test(text)) return "brand";
  if (/(operate|operations|delivery|fulfillment|coverage|staffing|vendor|supply)/.test(text)) return "operations";
  return "operations";
}

type SeedTemplate = ReadinessTemplate & { objective: string };

const BASE: SeedTemplate[] = [
  { item_key: "legal_entity", category: "Formation", title: "Legal entity", description: "Choose and form the business structure you will operate through.", objective: "Compare entity structures for this business and prepare the specific filing checklist once the owner decides.", priority: 10, help_kind: "integration", help_target: "bizee" },
  { item_key: "domain_name", category: "Formation", title: "Domain name", description: "Secure the primary web address for the business and brand.", objective: "Check availability of the strongest domain candidates for this business's actual name and brand.", priority: 20, help_kind: "guide", help_target: "domain" },
  { item_key: "business_email", category: "Formation", title: "Business email", description: "Set up a professional email address on your domain.", objective: "Recommend the right email/workspace tier for this business's size and hand back the exact setup steps.", priority: 30, help_kind: "guide", help_target: "email" },
  { item_key: "website", category: "Formation", title: "Website", description: "Publish a clear place for customers to understand and act on your offer.", objective: "Write the site's structure and home-page copy from this business's real plan, led by its strongest true claim.", priority: 40, help_kind: "agent", help_target: "build_website" },
  { item_key: "social_profiles", category: "Formation", title: "Social profiles", description: "Claim the channels your audience expects to find you on.", objective: "Identify the 2-3 channels this specific audience actually uses and draft the profile copy for each.", priority: 50, help_kind: "clara", help_target: "social" },
  { item_key: "launch_timeline", category: "Launch", title: "Launch timeline", description: "Set launch milestones, owners, dates, and dependencies.", objective: "Draft a dated milestone sequence tied to this business's actual constraints and dependencies.", priority: 110, help_kind: "clara", help_target: "timeline" },
  { item_key: "launch_campaign", category: "Launch", title: "Launch campaign", description: "Define the audience, offer, channels, sequence, and success measure.", objective: "Design one launch campaign scoped to this business's real audience, offer, and a stated win condition.", priority: 120, help_kind: "clara", help_target: "campaign" },
  { item_key: "launch_content", category: "Launch", title: "Launch content", description: "Prepare the core messages and assets needed for launch day.", objective: "Produce launch-day post drafts in the owner's voice, drawn from what is true this week in the plan.", priority: 130, help_kind: "agent", help_target: "daily_post" },
  { item_key: "publicity", category: "Launch", title: "Publicity", description: "Build a focused list of stories, outlets, communities, and outreach.", objective: "Build a short, specific list of outlets and communities worth pitching for this business, with an angle for each.", priority: 140, help_kind: "clara", help_target: "publicity" },
  { item_key: "partnerships", category: "Launch", title: "Launch partnerships", description: "Identify partners who can add reach, trust, distribution, or capability.", objective: "Name 3-5 realistic partner candidates for this business and what each side would actually get.", priority: 150, help_kind: "clara", help_target: "partnerships" },
  { item_key: "payment_collection", category: "Operate", title: "Payment collection", description: "Be ready to quote, invoice, collect, refund, and reconcile payments.", objective: "Identify the best-fit payment setup for this business's offer and prepare what's needed to connect it.", priority: 210, help_kind: "integration", help_target: "stripe" },
  { item_key: "bookkeeping", category: "Operate", title: "Bookkeeping system", description: "Separate business finances and establish a monthly close routine.", objective: "Recommend a bookkeeping setup sized to this business and hand back the exact first-month steps.", priority: 220, help_kind: "guide", help_target: "bookkeeping" },
  { item_key: "customer_process", category: "Operate", title: "Customer process", description: "Document the path from first contact through onboarding and support.", objective: "Map this business's actual first-contact-to-onboarding path and flag the gaps in it.", priority: 230, help_kind: "clara", help_target: "customer_process" },
  { item_key: "delivery_workflow", category: "Operate", title: "Delivery workflow", description: "Define how the offer is fulfilled consistently and who owns each step.", objective: "Check staffing/capacity coverage against the plan's real constraints and flag what it cannot absorb.", priority: 240, help_kind: "agent", help_target: "coverage_check" },
  { item_key: "core_compliance", category: "Operate", title: "Core compliance", description: "Identify licenses, registrations, insurance, notices, and renewal dates.", objective: "List every date, coverage line, and document that expires or needs attention in the next ninety days.", priority: 250, help_kind: "agent", help_target: "compliance_sweep" },
  { item_key: "acquisition_channel", category: "Grow", title: "Primary acquisition channel", description: "Choose one repeatable way to reach qualified prospects.", objective: "Recommend one primary acquisition motion fitted to this business's ICP and stage, not a generic list.", priority: 310, help_kind: "clara", help_target: "acquisition" },
  { item_key: "content_rhythm", category: "Grow", title: "Content rhythm", description: "Set a sustainable publishing cadence tied to customer questions.", objective: "Keep a sustainable content cadence running, drawn from what is actually happening in the business this week.", priority: 320, help_kind: "agent", help_target: "daily_post" },
  { item_key: "referral_motion", category: "Grow", title: "Referral motion", description: "Create a repeatable ask and reward for introductions.", objective: "Design a specific referral ask and reward that fits this business's margin and customer relationship.", priority: 330, help_kind: "clara", help_target: "referrals" },
  { item_key: "measurement", category: "Grow", title: "Growth measurement", description: "Track a small set of funnel, revenue, and retention measures.", objective: "Pick the small set of numbers that actually predict this business's growth and define how to track them.", priority: 340, help_kind: "clara", help_target: "metrics" },
  { item_key: "retention", category: "Grow", title: "Retention system", description: "Define how you keep, expand, and win back customers.", objective: "Define a retention/win-back approach specific to this business's customer relationship and repeat cycle.", priority: 350, help_kind: "clara", help_target: "retention" },
];

const INDUSTRY: { match: string[]; item: SeedTemplate }[] = [
  { match: ["food", "restaurant", "beverage", "catering"], item: { item_key: "food_permits", category: "Industry", title: "Food and service permits", description: "Confirm food handling, health, occupancy, alcohol, and local operating approvals.", objective: "List every date, coverage line, and document that expires or needs attention in the next ninety days.", priority: 405, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["health", "wellness", "salon", "therapy", "fitness"], item: { item_key: "practitioner_credentials", category: "Industry", title: "Practitioner credentials", description: "Verify every required license, scope-of-practice rule, and renewal date.", objective: "List every date, coverage line, and document that expires or needs attention in the next ninety days.", priority: 410, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["construction", "contractor", "home service", "remodel"], item: { item_key: "trade_coverage", category: "Industry", title: "Licensing, bonding, and insurance", description: "Confirm trade licenses, bonds, liability coverage, and certificate process.", objective: "List every date, coverage line, and document that expires or needs attention in the next ninety days.", priority: 415, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["retail", "e-commerce", "ecommerce", "product", "manufacturing"], item: { item_key: "inventory_fulfillment", category: "Industry", title: "Inventory and fulfillment controls", description: "Set reorder points, lead times, quality checks, returns, and fulfillment ownership.", objective: "Check staffing/capacity coverage against the plan's real constraints and flag what it cannot absorb.", priority: 420, help_kind: "agent", help_target: "coverage_check" } },
  { match: ["technology", "software", "saas", "app"], item: { item_key: "privacy_security", category: "Industry", title: "Privacy and security baseline", description: "Document data handling, access, backups, incident response, and customer terms.", objective: "List every date, coverage line, and document that expires or needs attention in the next ninety days.", priority: 425, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["professional", "consulting", "creative", "agency", "media"], item: { item_key: "client_agreement", category: "Industry", title: "Client agreement", description: "Standardize scope, payment, change requests, rights, confidentiality, and termination.", objective: "Draft a client agreement covering scope, payment, change requests, rights, and termination for this business.", priority: 430, help_kind: "clara", help_target: "agreement" } },
];

export function readinessTemplates(business: Pick<Business, "stage" | "industry">): ReadinessTemplate[] {
  const industry = (business.industry ?? "").toLowerCase();
  const stage = (business.stage ?? "").toLowerCase();
  const stageOffset = stage.includes("idea") ? 0 : stage.includes("building") ? 80 : stage.includes("first") ? 180 : stage.includes("growing") ? 280 : 300;
  const relevant = INDUSTRY.filter(({ match }) => match.some((word) => industry.includes(word))).map(({ item }) => item);
  return [...BASE, ...relevant].map((item) => ({
    ...item,
    priority: item.priority >= stageOffset && item.priority < stageOffset + 120 ? item.priority - 1_000 : item.priority,
  }));
}
