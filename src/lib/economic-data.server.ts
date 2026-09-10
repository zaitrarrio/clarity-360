type Indicator = {
  label: string;
  value: string;
  period: string;
  geography: string;
  source: string;
  sourceUrl: string;
};

export type EconomicSnapshot = {
  retrievedAt: string;
  indicators: Indicator[];
  notes: string[];
};

const BLS_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const CENSUS_ORIGIN = "https://api.census.gov/data";

const NAICS_BY_INDUSTRY: Record<string, string> = {
  "Food & Beverage": "722",
  "Retail & E-commerce": "44-45",
  "Professional & Consulting Services": "54",
  "Health, Wellness & Personal Care": "62",
  "Technology & Software": "51",
  "Creative & Media": "71",
  "Construction & Home Services": "23",
  "Real Estate & Property Services": "53",
  "Education & Childcare": "61",
  "Hospitality, Travel & Events": "72",
  "Manufacturing & Physical Products": "31-33",
};

const BLS_SERIES = [
  { id: "LNS14000000", label: "U.S. unemployment rate", suffix: "%" },
  { id: "CUUR0000SA0", label: "U.S. consumer price index", suffix: "" },
  { id: "CES0500000003", label: "Average hourly earnings, private sector", prefix: "$", suffix: "" },
  { id: "CES0000000001", label: "Total nonfarm employment", suffix: " thousand" },
] as const;

function firstZip(location: string): string | null {
  return location.match(/\b\d{5}(?:-\d{4})?\b/)?.[0]?.slice(0, 5) ?? null;
}

function censusValue(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > -600000000 ? parsed : null;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function number(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response.json();
}

async function loadBls(): Promise<Indicator[]> {
  const year = new Date().getUTCFullYear();
  const payload = await fetchJson(BLS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ seriesid: BLS_SERIES.map((series) => series.id), startyear: String(year - 1), endyear: String(year) }),
  }) as { status?: string; Results?: { series?: { seriesID?: string; data?: { year: string; periodName: string; value: string }[] }[] } };
  if (payload.status !== "REQUEST_SUCCEEDED") throw new Error("BLS request failed");

  return (payload.Results?.series ?? []).flatMap((series) => {
    const definition = BLS_SERIES.find((item) => item.id === series.seriesID);
    const latest = series.data?.[0];
    if (!definition || !latest) return [];
    return [{
      label: definition.label,
      value: `${"prefix" in definition ? definition.prefix : ""}${number(Number(latest.value))}${definition.suffix}`,
      period: `${latest.periodName} ${latest.year}`,
      geography: "United States",
      source: "U.S. Bureau of Labor Statistics",
      sourceUrl: `https://data.bls.gov/timeseries/${definition.id}`,
    }];
  });
}

async function loadAcs(zip: string, key: string): Promise<Indicator[]> {
  const year = 2024;
  const variables = "NAME,B01003_001E,B19013_001E,B23025_003E,B23025_005E,B28002_004E,B28002_001E";
  const url = `${CENSUS_ORIGIN}/${year}/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zip}&key=${encodeURIComponent(key)}`;
  const rows = await fetchJson(url) as string[][];
  const headers = rows[0];
  const row = rows[1];
  if (!headers || !row) throw new Error("No Census profile found for that ZIP code");
  const get = (name: string) => row[headers.indexOf(name)];
  const geography = get("NAME") ?? `ZIP ${zip}`;
  const population = censusValue(get("B01003_001E"));
  const income = censusValue(get("B19013_001E"));
  const laborForce = censusValue(get("B23025_003E"));
  const unemployed = censusValue(get("B23025_005E"));
  const broadband = censusValue(get("B28002_004E"));
  const households = censusValue(get("B28002_001E"));
  const sourceUrl = `https://data.census.gov/profile?g=860XX00US${zip}`;
  const output: Indicator[] = [];
  if (population !== null) output.push({ label: "Population", value: number(population), period: `${year} ACS 5-year estimate`, geography, source: "U.S. Census Bureau, American Community Survey", sourceUrl });
  if (income !== null) output.push({ label: "Median household income", value: money(income), period: `${year} ACS 5-year estimate`, geography, source: "U.S. Census Bureau, American Community Survey", sourceUrl });
  if (laborForce && unemployed !== null) output.push({ label: "Civilian unemployment rate", value: `${number((unemployed / laborForce) * 100)}%`, period: `${year} ACS 5-year estimate`, geography, source: "U.S. Census Bureau, American Community Survey", sourceUrl });
  if (households && broadband !== null) output.push({ label: "Households with broadband", value: `${number((broadband / households) * 100)}%`, period: `${year} ACS 5-year estimate`, geography, source: "U.S. Census Bureau, American Community Survey", sourceUrl });
  return output;
}

async function loadIndustry(industry: string, key: string): Promise<Indicator[]> {
  const name = Object.keys(NAICS_BY_INDUSTRY).find((label) => industry.includes(label));
  const naics = name ? NAICS_BY_INDUSTRY[name] : undefined;
  if (!naics) return [];
  const year = 2023;
  const url = `${CENSUS_ORIGIN}/${year}/cbp?get=NAME,NAICS2022_LABEL,ESTAB,EMP,PAYANN&for=us:*&NAICS2022=${encodeURIComponent(naics)}&key=${encodeURIComponent(key)}`;
  const rows = await fetchJson(url) as string[][];
  const headers = rows[0];
  const row = rows[1];
  if (!headers || !row) throw new Error("No Census industry benchmark found");
  const get = (field: string) => row[headers.indexOf(field)];
  const sourceUrl = "https://www.census.gov/programs-surveys/cbp/data.html";
  return [
    { label: `${get("NAICS2022_LABEL") ?? name} establishments`, value: number(Number(get("ESTAB"))), period: `${year}`, geography: "United States", source: "U.S. Census Bureau, County Business Patterns", sourceUrl },
    { label: "Industry employment", value: number(Number(get("EMP"))), period: `${year}`, geography: "United States", source: "U.S. Census Bureau, County Business Patterns", sourceUrl },
    { label: "Annual payroll", value: `${money(Number(get("PAYANN")) * 1000)}`, period: `${year}`, geography: "United States", source: "U.S. Census Bureau, County Business Patterns", sourceUrl },
  ];
}

export async function loadEconomicSnapshot(input: { location: string | null; industry: string | null }): Promise<EconomicSnapshot> {
  const indicators: Indicator[] = [];
  const notes: string[] = [];
  try {
    indicators.push(...await loadBls());
  } catch {
    notes.push("Current BLS indicators are temporarily unavailable.");
  }

  const censusKey = process.env["CENSUS_API_KEY"];
  const zip = firstZip(input.location ?? "");
  if (!censusKey) {
    notes.push("Local and industry Census indicators are unavailable because Census access is not configured.");
  } else {
    if (zip) {
      try { indicators.push(...await loadAcs(zip, censusKey)); } catch { notes.push(`No current Census profile was available for ZIP ${zip}.`); }
    } else {
      notes.push("Add a five-digit U.S. ZIP code to the plan for local Census indicators.");
    }
    if (input.industry) {
      try { indicators.push(...await loadIndustry(input.industry, censusKey)); } catch { notes.push("The Census industry benchmark is temporarily unavailable."); }
    }
  }

  return { retrievedAt: new Date().toISOString(), indicators, notes };
}

export function economicSnapshotPrompt(snapshot: EconomicSnapshot): string {
  const lines = ["LIVE EXTERNAL INDICATORS:"];
  for (const item of snapshot.indicators) {
    lines.push(`- ${item.label}: ${item.value} (${item.geography}; ${item.period}). Source: ${item.source} — ${item.sourceUrl}`);
  }
  for (const note of snapshot.notes) lines.push(`- Availability note: ${note}`);
  lines.push(`Retrieved: ${snapshot.retrievedAt}`);
  return lines.join("\n");
}