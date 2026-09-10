import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type GlossaryTerm = { term: string; definition: string };

/** Common business/plan shorthand Clara uses, so definitions work even when the model omits its own. */
const BASE_TERMS: GlossaryTerm[] = [
  { term: "CAC", definition: "Customer acquisition cost — what it costs, all in, to win one paying customer." },
  { term: "LTV", definition: "Lifetime value — the total gross profit one customer brings over their whole relationship with you." },
  { term: "AOV", definition: "Average order value — the typical amount a customer spends in a single purchase." },
  { term: "ARPU", definition: "Average revenue per user — revenue in a period divided by the number of active customers." },
  { term: "MRR", definition: "Monthly recurring revenue — the predictable revenue you bill every month." },
  { term: "ARR", definition: "Annual recurring revenue — monthly recurring revenue multiplied by twelve." },
  { term: "COGS", definition: "Cost of goods sold — the direct cost of delivering what you sell." },
  { term: "GMV", definition: "Gross merchandise value — the total value of everything sold through you, before your cut." },
  { term: "SKU", definition: "Stock keeping unit — one specific sellable item or variant." },
  { term: "MVP", definition: "Minimum viable product — the smallest version worth putting in front of real customers." },
  { term: "ICP", definition: "Ideal customer profile — the specific kind of buyer your plan is built around." },
  { term: "TAM", definition: "Total addressable market — everyone who could ever buy this category." },
  { term: "SAM", definition: "Serviceable available market — the slice of the market you can actually reach today." },
  { term: "SOM", definition: "Serviceable obtainable market — the share you can realistically win in the near term." },
  { term: "SEO", definition: "Search engine optimisation — earning traffic from unpaid search results." },
  { term: "SEM", definition: "Search engine marketing — buying visibility in search results." },
  { term: "CTR", definition: "Click-through rate — the share of people who see something and click it." },
  { term: "CRM", definition: "Customer relationship management — the system that tracks leads and customers." },
  { term: "KPI", definition: "Key performance indicator — a number you steer the business by." },
  { term: "ROI", definition: "Return on investment — profit earned relative to money put in." },
  { term: "ROAS", definition: "Return on ad spend — revenue earned for every unit of currency spent on ads." },
  { term: "P&L", definition: "Profit and loss — the statement showing revenue, costs and what's left." },
  { term: "B2B", definition: "Business to business — you sell to other companies." },
  { term: "B2C", definition: "Business to consumer — you sell to individual people." },
  { term: "D2C", definition: "Direct to consumer — you sell straight to the end customer, with no retailer in between." },
  { term: "SaaS", definition: "Software as a service — software sold as an ongoing subscription." },
  { term: "NPS", definition: "Net promoter score — a measure of how likely customers are to recommend you." },
  { term: "SLA", definition: "Service level agreement — the service standard you commit to in writing." },
  { term: "MOQ", definition: "Minimum order quantity — the smallest batch a supplier will make or sell." },
  { term: "FTE", definition: "Full-time equivalent — one full-time person's worth of hours." },
  { term: "QSR", definition: "Quick service restaurant — fast-food style, counter or drive-through service." },
  { term: "POS", definition: "Point of sale — the checkout system that takes payment and records the sale." },
  { term: "DSO", definition: "Days sales outstanding — how long, on average, customers take to pay you." },
  { term: "EBITDA", definition: "Earnings before interest, tax, depreciation and amortisation — a rough measure of operating profit." },
  { term: "CPL", definition: "Cost per lead — what you pay for one qualified enquiry." },
  { term: "CPM", definition: "Cost per thousand impressions — the price of showing an ad a thousand times." },
  { term: "CPC", definition: "Cost per click — what you pay each time someone clicks your ad." },
  { term: "API", definition: "Application programming interface — the way two software systems talk to each other." },
  { term: "GTM", definition: "Go to market — how you reach and sell to your first and next customers." },
  { term: "PMF", definition: "Product-market fit — clear evidence that a specific market genuinely wants what you built." },
  { term: "UGC", definition: "User-generated content — photos, videos or reviews made by customers rather than by you." },
  { term: "RFP", definition: "Request for proposal — a formal invitation to bid for a piece of work." },
];

const GlossaryCtx = createContext<Record<string, string>>({});

function normalise(t: string) {
  return t.trim().toLowerCase();
}

export function GlossaryProvider({ terms, children }: { terms?: GlossaryTerm[]; children: ReactNode }) {
  const map = useMemo(() => {
    const out: Record<string, string> = {};
    for (const t of [...BASE_TERMS, ...(terms ?? [])]) {
      if (t?.term && t?.definition) out[normalise(t.term)] = t.definition;
    }
    return out;
  }, [terms]);
  return <GlossaryCtx.Provider value={map}>{children}</GlossaryCtx.Provider>;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders text with any known abbreviation or acronym turned into a clickable definition. */
export function Gloss({ children }: { children?: string | null }) {
  const map = useContext(GlossaryCtx);
  const text = children ?? "";

  const parts = useMemo(() => {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    if (!text || keys.length === 0) return [text];
    const re = new RegExp(`(?<![\\w])(${keys.map(escapeRe).join("|")})(?![\\w])`, "gi");
    const out: (string | { term: string; label: string })[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      const label = m[0];
      const def = map[normalise(label)];
      if (!def) continue;
      if (i > last) out.push(text.slice(last, i));
      out.push({ term: normalise(label), label });
      last = i + label.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [text, map]);

  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <Popover key={i}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="cursor-help rounded-sm underline decoration-ember/60 decoration-dotted underline-offset-[3px] transition-colors hover:text-ember"
              >
                {p.label}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-72 border-border bg-card p-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ember-deep">{p.label}</div>
              <p className="mt-1.5 text-[13px] font-light leading-relaxed text-foreground">{map[p.term]}</p>
            </PopoverContent>
          </Popover>
        ),
      )}
    </>
  );
}
