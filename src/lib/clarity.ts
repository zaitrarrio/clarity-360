export const DEMO_BUSINESS_ID = "11111111-1111-1111-1111-111111111111";

export type DomainKey =
  | "market"
  | "offer"
  | "growth"
  | "operations"
  | "finance"
  | "brand"
  | "risk";

export const DOMAINS: { key: DomainKey; label: string; agent: string; n: string }[] = [
  { key: "market", label: "The Market", agent: "Market Agent", n: "01" },
  { key: "offer", label: "The Offer", agent: "Offer Agent", n: "02" },
  { key: "growth", label: "Growth", agent: "Growth Agent", n: "03" },
  { key: "operations", label: "Operations", agent: "Operations Agent", n: "04" },
  { key: "finance", label: "Finance", agent: "Finance Agent", n: "05" },
  { key: "brand", label: "Brand & Story", agent: "Messaging Agent", n: "06" },
  { key: "risk", label: "Risk & Compliance", agent: "Risk Agent", n: "07" },
];

export const AGENT_NAMES: Record<string, string> = {
  clara: "Clara",
  market: "Market Agent",
  offer: "Offer Agent",
  growth: "Growth Agent",
  operations: "Operations Agent",
  finance: "Finance Agent",
  brand: "Messaging Agent",
  risk: "Risk Agent",
};

export type Metric = { label: string; value: string };

export type PlanSection = {
  id: string;
  business_id: string;
  domain_key: string;
  title: string;
  kicker: string | null;
  ordinal: number;
  summary: string | null;
  findings: string[];
  decisions: string[];
  metrics: Metric[];
  updated_at: string;
};

export type Business = {
  id: string;
  name: string;
  tagline: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  is_demo: boolean;
  user_id: string | null;
};

export type ActionDef = {
  id: string;
  business_id: string;
  domain_key: string | null;
  action_key: string;
  title: string;
  description: string | null;
  kind: "one_shot" | "recurring" | string;
  agent_key: string | null;
  ordinal: number;
};

export type ActionRun = {
  id: string;
  action_key: string;
  title: string;
  agent_key: string | null;
  status: string;
  artifact_title: string | null;
  artifact_body: string | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
};

export type Schedule = {
  id: string;
  action_key: string;
  agent_key: string | null;
  cadence: string;
  next_run_at: string;
  last_run_at: string | null;
  active: boolean;
};

export type Signal = {
  id: string;
  agent_key: string | null;
  domain_key: string | null;
  severity: string;
  title: string;
  body: string | null;
  suggested_action_key: string | null;
  status: string;
  created_at: string;
};

export type AgentRow = {
  id: string;
  agent_key: string;
  name: string;
  domain_key: string | null;
  description: string | null;
  status: string;
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "due now";
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `in ${Math.max(1, hours)}h`;
  return `in ${Math.round(hours / 24)}d`;
}
