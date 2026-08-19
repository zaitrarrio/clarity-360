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

export type Seed = {
  name: string;
  stage: string;
  industryKey: string;
  subcategory: string;
  location: string;
  website: string;
  objective: string;
};

export const EMPTY_SEED: Seed = {
  name: "",
  stage: "",
  industryKey: "",
  subcategory: "",
  location: "",
  website: "",
  objective: "",
};

export function seedIndustryLabel(seed: Seed): string {
  const industry = industryByKey(seed.industryKey);
  if (!industry) return seed.subcategory || "General";
  return seed.subcategory ? `${industry.label} · ${seed.subcategory}` : industry.label;
}

export function seedSummary(seed: Seed): string {
  return [
    `Business: ${seed.name}`,
    `Stage: ${seed.stage}`,
    `Industry: ${seedIndustryLabel(seed)}`,
    `Where: ${seed.location}`,
    seed.website ? `Website: ${seed.website}` : null,
    `Objective: ${seed.objective}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const SEED_STORAGE_KEY = "c360.seed";

export function readStoredSeed(): Seed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SEED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Seed;
    return parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSeed(seed: Seed) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(seed));
}
