import type { Business } from "./clarity";

export type ReadinessStatus = "not_started" | "needs_help" | "complete";
export type ReadinessHelpKind = "clara" | "agent" | "integration" | "guide";

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
  created_at: string;
  updated_at: string;
};

export type ReadinessTemplate = Omit<
  ReadinessItem,
  "id" | "business_id" | "status" | "created_at" | "updated_at"
>;

const BASE: ReadinessTemplate[] = [
  { item_key: "legal_entity", category: "Formation", title: "Legal entity", description: "Choose and form the business structure you will operate through.", priority: 10, help_kind: "integration", help_target: "bizee" },
  { item_key: "domain_name", category: "Formation", title: "Domain name", description: "Secure the primary web address for the business and brand.", priority: 20, help_kind: "guide", help_target: "domain" },
  { item_key: "business_email", category: "Formation", title: "Business email", description: "Set up a professional email address on your domain.", priority: 30, help_kind: "guide", help_target: "email" },
  { item_key: "website", category: "Formation", title: "Website", description: "Publish a clear place for customers to understand and act on your offer.", priority: 40, help_kind: "agent", help_target: "build_website" },
  { item_key: "social_profiles", category: "Formation", title: "Social profiles", description: "Claim the channels your audience expects to find you on.", priority: 50, help_kind: "clara", help_target: "social" },
  { item_key: "launch_timeline", category: "Launch", title: "Launch timeline", description: "Set launch milestones, owners, dates, and dependencies.", priority: 110, help_kind: "clara", help_target: "timeline" },
  { item_key: "launch_campaign", category: "Launch", title: "Launch campaign", description: "Define the audience, offer, channels, sequence, and success measure.", priority: 120, help_kind: "clara", help_target: "campaign" },
  { item_key: "launch_content", category: "Launch", title: "Launch content", description: "Prepare the core messages and assets needed for launch day.", priority: 130, help_kind: "agent", help_target: "daily_post" },
  { item_key: "publicity", category: "Launch", title: "Publicity", description: "Build a focused list of stories, outlets, communities, and outreach.", priority: 140, help_kind: "clara", help_target: "publicity" },
  { item_key: "partnerships", category: "Launch", title: "Launch partnerships", description: "Identify partners who can add reach, trust, distribution, or capability.", priority: 150, help_kind: "clara", help_target: "partnerships" },
  { item_key: "payment_collection", category: "Operate", title: "Payment collection", description: "Be ready to quote, invoice, collect, refund, and reconcile payments.", priority: 210, help_kind: "integration", help_target: "stripe" },
  { item_key: "bookkeeping", category: "Operate", title: "Bookkeeping system", description: "Separate business finances and establish a monthly close routine.", priority: 220, help_kind: "guide", help_target: "bookkeeping" },
  { item_key: "customer_process", category: "Operate", title: "Customer process", description: "Document the path from first contact through onboarding and support.", priority: 230, help_kind: "clara", help_target: "customer_process" },
  { item_key: "delivery_workflow", category: "Operate", title: "Delivery workflow", description: "Define how the offer is fulfilled consistently and who owns each step.", priority: 240, help_kind: "agent", help_target: "coverage_check" },
  { item_key: "core_compliance", category: "Operate", title: "Core compliance", description: "Identify licenses, registrations, insurance, notices, and renewal dates.", priority: 250, help_kind: "agent", help_target: "compliance_sweep" },
  { item_key: "acquisition_channel", category: "Grow", title: "Primary acquisition channel", description: "Choose one repeatable way to reach qualified prospects.", priority: 310, help_kind: "clara", help_target: "acquisition" },
  { item_key: "content_rhythm", category: "Grow", title: "Content rhythm", description: "Set a sustainable publishing cadence tied to customer questions.", priority: 320, help_kind: "agent", help_target: "daily_post" },
  { item_key: "referral_motion", category: "Grow", title: "Referral motion", description: "Create a repeatable ask and reward for introductions.", priority: 330, help_kind: "clara", help_target: "referrals" },
  { item_key: "measurement", category: "Grow", title: "Growth measurement", description: "Track a small set of funnel, revenue, and retention measures.", priority: 340, help_kind: "clara", help_target: "metrics" },
  { item_key: "retention", category: "Grow", title: "Retention system", description: "Define how you keep, expand, and win back customers.", priority: 350, help_kind: "clara", help_target: "retention" },
];

const INDUSTRY: { match: string[]; item: ReadinessTemplate }[] = [
  { match: ["food", "restaurant", "beverage", "catering"], item: { item_key: "food_permits", category: "Industry", title: "Food and service permits", description: "Confirm food handling, health, occupancy, alcohol, and local operating approvals.", priority: 405, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["health", "wellness", "salon", "therapy", "fitness"], item: { item_key: "practitioner_credentials", category: "Industry", title: "Practitioner credentials", description: "Verify every required license, scope-of-practice rule, and renewal date.", priority: 410, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["construction", "contractor", "home service", "remodel"], item: { item_key: "trade_coverage", category: "Industry", title: "Licensing, bonding, and insurance", description: "Confirm trade licenses, bonds, liability coverage, and certificate process.", priority: 415, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["retail", "e-commerce", "ecommerce", "product", "manufacturing"], item: { item_key: "inventory_fulfillment", category: "Industry", title: "Inventory and fulfillment controls", description: "Set reorder points, lead times, quality checks, returns, and fulfillment ownership.", priority: 420, help_kind: "agent", help_target: "coverage_check" } },
  { match: ["technology", "software", "saas", "app"], item: { item_key: "privacy_security", category: "Industry", title: "Privacy and security baseline", description: "Document data handling, access, backups, incident response, and customer terms.", priority: 425, help_kind: "agent", help_target: "compliance_sweep" } },
  { match: ["professional", "consulting", "creative", "agency", "media"], item: { item_key: "client_agreement", category: "Industry", title: "Client agreement", description: "Standardize scope, payment, change requests, rights, confidentiality, and termination.", priority: 430, help_kind: "clara", help_target: "agreement" } },
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
