/**
 * The industry taxonomy the operating-plan template specialises against.
 * Categories and subcategories come from the Industry Specialization Guide;
 * `axes` are the parameters that must be known before a plan can be
 * specialised away from the generic seven-section skeleton.
 */

export type Industry = {
  key: string;
  label: string;
  subcategories: string[];
  axes: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    key: "food_beverage",
    label: "Food & Beverage",
    subcategories: [
      "Full-service restaurant",
      "Quick-service / fast-casual",
      "Food truck / mobile vendor",
      "Catering",
      "Ghost kitchen / delivery-only",
      "Packaged food or beverage (CPG)",
      "Bar / brewery / winery",
    ],
    axes: [
      "Prime cost target (food + labour as % of revenue)",
      "Daypart and covers model",
      "Location, lease and trade area",
      "Licensing and food-handling critical path",
      "Delivery-platform dependence",
    ],
  },
  {
    key: "retail_ecommerce",
    label: "Retail & E-commerce",
    subcategories: [
      "Independent physical retail store",
      "Pure e-commerce (owned site)",
      "Marketplace-native seller",
      "Omnichannel (store + online)",
      "Subscription box",
    ],
    axes: [
      "Owned channel vs marketplace dependence",
      "Inventory turns and working-capital cycle",
      "Blended CAC vs contribution margin",
      "Returns rate and fulfilment model",
      "Assortment depth vs breadth",
    ],
  },
  {
    key: "professional_services",
    label: "Professional & Consulting Services",
    subcategories: [
      "Management / strategy consulting",
      "Marketing / creative agency",
      "Accounting / bookkeeping",
      "Legal services",
      "Coaching / advisory",
      "IT / technical consulting",
    ],
    axes: [
      "Billing model (hourly, retainer, fixed fee, outcome)",
      "Utilisation target and bench risk",
      "Founder-delivered vs leveraged team",
      "Client concentration",
      "Referral vs outbound pipeline",
    ],
  },
  {
    key: "health_wellness",
    label: "Health, Wellness & Personal Care",
    subcategories: [
      "Fitness studio / gym",
      "Salon / spa / barbershop",
      "Med spa / aesthetics",
      "Therapy / counseling practice",
      "Nutrition / wellness coaching",
      "Massage / bodywork",
    ],
    axes: [
      "Membership vs per-visit revenue",
      "Practitioner licensing and scope",
      "Chair / room / class utilisation",
      "Insurance vs cash-pay",
      "Retention and churn cadence",
    ],
  },
  {
    key: "technology",
    label: "Technology & Software",
    subcategories: [
      "SaaS (recurring subscription)",
      "Custom dev shop / agency",
      "Licensed / on-premise software",
      "Mobile app (ads or one-time purchase)",
      "Hardware-adjacent / IoT product",
      "Marketplace / platform (two-sided)",
    ],
    axes: [
      "Monetisation model and pricing metric",
      "Self-serve vs sales-led motion",
      "Net revenue retention or repeat purchase",
      "Build capacity and technical risk",
      "Cold-start / liquidity problem (if a marketplace)",
    ],
  },
  {
    key: "creative_media",
    label: "Creative & Media",
    subcategories: [
      "Design studio",
      "Photography / videography",
      "Content / marketing agency",
      "Production company",
      "Independent creator / personal brand",
    ],
    axes: [
      "Project vs retainer revenue mix",
      "Rights, licensing and residuals",
      "Founder-as-brand dependence",
      "Crew and freelancer supply",
      "Audience vs client-driven demand",
    ],
  },
  {
    key: "construction_home",
    label: "Construction & Home Services",
    subcategories: [
      "General contractor",
      "Specialty trade (electrical, plumbing, HVAC)",
      "Landscaping / lawn care",
      "Residential cleaning",
      "Handyman / repair",
      "Remodeling",
    ],
    axes: [
      "Emergency / callout work vs maintenance agreements",
      "Crew count and truck capacity",
      "Licensing, bonding and insurance",
      "Job costing and change-order discipline",
      "Local search and review position",
    ],
  },
  {
    key: "real_estate",
    label: "Real Estate & Property Services",
    subcategories: [
      "Real estate agent / team",
      "Brokerage",
      "Property management",
      "Home staging",
      "Investing / flipping",
    ],
    axes: [
      "Commission vs fee vs spread revenue",
      "Deal cycle length and pipeline coverage",
      "Capital access and leverage",
      "Geographic farm and market cycle exposure",
      "Licensing and compliance obligations",
    ],
  },
  {
    key: "education_childcare",
    label: "Education & Childcare",
    subcategories: [
      "Tutoring (1:1 or small group)",
      "Test prep",
      "Cohort-based courses",
      "Daycare / early childhood center",
      "Enrichment programs (arts, STEM, sports)",
    ],
    axes: [
      "Ratio, licensing and capacity ceiling",
      "Enrolment cycle and seasonality",
      "Staff qualification supply",
      "Tuition model and subsidy exposure",
      "Waitlist conversion",
    ],
  },
  {
    key: "hospitality_events",
    label: "Hospitality, Travel & Events",
    subcategories: [
      "Hotel / B&B / short-term rental",
      "Event planning / coordination",
      "Venue (event space)",
      "Tour operator / experience provider",
      "Wedding / event vendor",
    ],
    axes: [
      "Occupancy, ADR and seasonality",
      "Booking channel and OTA dependence",
      "Deposit structure and cancellation risk",
      "Fixed-cost base vs variable demand",
      "Permits, safety and liability",
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing & Physical Products",
    subcategories: [
      "Small-batch / artisan manufacturing",
      "Contract manufacturing",
      "Consumer product goods (owned brand)",
      "Industrial / B2B components",
    ],
    axes: [
      "Bill of materials and unit economics",
      "MOQ, lead times and supplier concentration",
      "Capacity, tooling and capital equipment",
      "Wholesale vs direct channel mix",
      "Quality, certification and compliance",
    ],
  },
];

export const STAGES = [
  "Idea — nothing built yet",
  "Building — pre-revenue",
  "First customers",
  "Trading and growing",
  "Established, looking to scale",
];

export const OBJECTIVES = [
  "Decide whether to start at all",
  "Launch in the next 90 days",
  "Find my first paying customers",
  "Grow revenue predictably",
  "Fix margins and cash flow",
  "Raise money or apply for finance",
  "Hire and get out of the day-to-day",
];

export function industryByKey(key: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.key === key);
}

export type ReachModel = "on_premise" | "service_area" | "online" | "hybrid";

export const REACH_MODELS: { key: ReachModel; label: string; hint: string }[] = [
  { key: "on_premise", label: "On-premise — customers come to us", hint: "Restaurant, salon, studio, daycare" },
  { key: "service_area", label: "We go to them — service area", hint: "HVAC, landscaping, cleaning, mobile" },
  { key: "online", label: "Online — regional or global", hint: "E-commerce, SaaS, creator, remote services" },
  { key: "hybrid", label: "Hybrid — a base plus online reach", hint: "Store or studio with online sales" },
];

export const TRADE_AREA_RADII = [
  "Walk-in / immediate neighbourhood",
  "Within 5 miles",
  "Within 15 miles",
  "Whole metro",
];

export const SERVICE_RADII = ["Within 10 miles", "Within 25 miles", "Within 50 miles", "Statewide"];

export const REGIONS = [
  "United States",
  "Canada",
  "UK & Ireland",
  "European Union",
  "LATAM",
  "APAC",
  "MENA",
  "Africa",
  "Global",
];

export type Market = {
  reach: ReachModel | "";
  baseLocation: string;
  serviceAreas: string[];
  radius: string;
  regions: string[];
  primaryRegion: string;
  audienceNote: string;
};

export const EMPTY_MARKET: Market = {
  reach: "",
  baseLocation: "",
  serviceAreas: [],
  radius: "",
  regions: [],
  primaryRegion: "",
  audienceNote: "",
};

export function needsBase(reach: Market["reach"]): boolean {
  return reach === "on_premise" || reach === "service_area" || reach === "hybrid";
}

export function needsServiceAreas(reach: Market["reach"]): boolean {
  return reach === "service_area" || reach === "hybrid";
}

export function needsRegions(reach: Market["reach"]): boolean {
  return reach === "online" || reach === "hybrid";
}

export function marketComplete(market: Market): boolean {
  if (!market.reach) return false;
  if (needsBase(market.reach) && !market.baseLocation.trim()) return false;
  if (market.reach === "service_area" && market.serviceAreas.length === 0 && !market.radius) return false;
  if (needsRegions(market.reach) && market.regions.length === 0) return false;
  return true;
}

export function marketLines(market: Market): string[] {
  const reach = REACH_MODELS.find((r) => r.key === market.reach);
  const lines: string[] = [];
  if (reach) lines.push(`Reach model: ${reach.label}`);
  if (market.baseLocation.trim()) lines.push(`Based in: ${market.baseLocation.trim()}`);
  if (market.serviceAreas.length) lines.push(`Service area: ${market.serviceAreas.join(", ")}`);
  if (market.radius) lines.push(`Customer travel / crew radius: ${market.radius}`);
  if (market.regions.length) lines.push(`Markets served: ${market.regions.join(", ")}`);
  if (market.primaryRegion) lines.push(`Primary market: ${market.primaryRegion}`);
  if (market.audienceNote.trim()) lines.push(`Audience: ${market.audienceNote.trim()}`);
  return lines;
}

export function marketSummary(market: Market): string {
  const lines = marketLines(market);
  return lines.length ? lines.join(" · ") : "Market not specified";
}

export type Seed = {
  name: string;
  stage: string;
  industryKey: string;
  subcategory: string;
  market: Market;
  website: string;
  objective: string;
};

export const EMPTY_SEED: Seed = {
  name: "",
  stage: "",
  industryKey: "",
  subcategory: "",
  market: EMPTY_MARKET,
  website: "",
  objective: "",
};

export function seedIndustryLabel(seed: Seed): string {
  const industry = industryByKey(seed.industryKey);
  if (!industry) return seed.subcategory || "General";
  return seed.subcategory ? `${industry.label} · ${seed.subcategory}` : industry.label;
}

type SavedIntake = {
  business: { name: string; industry: string | null; stage: string | null };
  responses: { question_key: string; question: string; answer: string | null }[];
};

function validSeed(value: unknown): Seed | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Seed>;
  if (!candidate.name || !candidate.market || typeof candidate.market !== "object") return null;
  return normaliseSeed(candidate as Seed);
}

/** Rebuild the intake form from its exact saved snapshot, with a fallback for older plans. */
export function seedFromSavedIntake(saved: SavedIntake): Seed {
  const snapshot = saved.responses.find((response) => response.question_key === "intake_seed")?.answer;
  if (snapshot) {
    try {
      const parsed = validSeed(JSON.parse(snapshot));
      if (parsed) return parsed;
    } catch {
      // Older plans predate the exact intake snapshot and are reconstructed below.
    }
  }

  const answers = new Map(
    saved.responses.map((response) => [response.question_key, response.answer ?? ""]),
  );
  const marketAnswers = new Map(
    saved.responses
      .filter((response) => response.question_key.startsWith("market_"))
      .map((response) => [response.question, response.answer ?? ""]),
  );
  const industryText = saved.business.industry ?? "";
  const industry = INDUSTRIES.find(
    (item) => industryText === item.label || industryText.startsWith(`${item.label} · `),
  );
  const subcategory = industry ? industryText.slice(industry.label.length).replace(/^\s*·\s*/, "") : "";
  const reachText = marketAnswers.get("Reach model") ?? "";
  const reach = REACH_MODELS.find((item) => reachText.startsWith(item.label))?.key ?? "";

  return {
    ...EMPTY_SEED,
    name: saved.business.name,
    stage: answers.get("stage") || saved.business.stage || "",
    industryKey: industry?.key ?? "",
    subcategory,
    market: {
      ...EMPTY_MARKET,
      reach,
      baseLocation: marketAnswers.get("Based in") ?? "",
      serviceAreas: (marketAnswers.get("Service area") ?? "").split(", ").filter(Boolean),
      radius: marketAnswers.get("Customer travel / crew radius") ?? "",
      regions: (marketAnswers.get("Markets served") ?? "").split(", ").filter(Boolean),
      primaryRegion: marketAnswers.get("Primary market") ?? "",
      audienceNote: marketAnswers.get("Audience") ?? "",
    },
    website: answers.get("website") ?? "",
    objective: answers.get("objective") ?? "",
  };
}

export function seedSummary(seed: Seed): string {
  return [
    `Business: ${seed.name}`,
    `Stage: ${seed.stage}`,
    `Industry: ${seedIndustryLabel(seed)}`,
    ...marketLines(seed.market),
    seed.website ? `Website: ${seed.website}` : null,
    `Objective: ${seed.objective}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const SEED_STORAGE_KEY = "c360.seed";

/** Older stored seeds carried a single free-text `location`; fold it into the market shape. */
function normaliseSeed(parsed: Seed & { location?: string }): Seed {
  const market: Market = { ...EMPTY_MARKET, ...(parsed.market ?? {}) };
  if (!parsed.market && parsed.location) {
    const online = /online/i.test(parsed.location);
    market.reach = online ? "online" : "on_premise";
    if (online) market.regions = ["United States"];
    else market.baseLocation = parsed.location;
  }
  return { ...EMPTY_SEED, ...parsed, market };
}

export function readStoredSeed(): Seed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SEED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Seed & { location?: string };
    return parsed?.name ? normaliseSeed(parsed) : null;
  } catch {
    return null;
  }
}

export function storeSeed(seed: Seed) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(seed));
}

