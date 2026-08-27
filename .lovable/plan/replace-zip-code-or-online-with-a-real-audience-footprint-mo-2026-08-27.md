# Replace "Zip code or online" with a real audience & footprint model

Where a business operates and where its customers come from are two different facts, and today they're squeezed into one free-text box. The plan replaces that field with a small structured "market" block that covers physical, service-area, and online businesses.

## The model

One field decides the shape, then the follow-ups adapt:

**Reach model** (single choice, drives everything else)
- On-premise — customers come to us (restaurant, salon, studio, daycare)
- We go to them — service area (HVAC, landscaping, cleaning)
- Online — regional or global (e-commerce, SaaS, creator)
- Hybrid — a base location plus online reach

**Then, conditionally:**
- Base location (shown for on-premise, service-area, hybrid): city/state or zip — where the business physically sits.
- Service area (service-area + hybrid): a chip list of zips or cities you type and add, plus an optional "within N miles of base" radius.
- Trade-area radius (on-premise): how far customers realistically travel — walk-in, 5 mi, 15 mi, whole metro.
- Markets served (online + hybrid): multi-select regions — US, Canada, UK/Ireland, EU, LATAM, APAC, MENA, Africa, Global — plus optional "primary market" from the chosen set.
- Audience note (all, optional, one line): who the customers actually are, e.g. "dual-income parents within 10 minutes of the campus".

This gives Clara what she needs for specialization: trade-area density, travel time and crew radius, tax/regulatory footprint, currency and channel exposure, and CAC geography — none of which a bare zip conveys.

## Where it shows up

- Intake step 1 replaces the single "Zip code or online" input with the reach-model select and its conditional follow-ups. Field count stays at six conceptual items; the market block counts as one.
- Validation: a market is complete when the reach model plus its required part (base location, at least one service area entry, or at least one region) is filled.
- Draft and fork flows show the market as readable lines in the "what we know" list instead of a single Where row.
- Clara's prompt context gets the structured market rendered as sentences ("On-premise in Round Rock TX, customers travel up to 15 minutes") so assumptions and forks key off it.
- The plan builder writes a human-readable summary into the existing `businesses.location` column and keeps the structured object alongside it, so nothing downstream breaks.

## Technical notes

- `src/lib/industries.ts`: add a `Market` type (`reach`, `baseLocation`, `serviceAreas: string[]`, `radius`, `regions: string[]`, `primaryRegion`, `audienceNote`), replace `Seed.location` with `market`, add `marketSummary(market)` and update `seedSummary`. Session-storage seed reads stay backward compatible by defaulting missing markets.
- `src/lib/onboarding.functions.ts`: extend the Zod seed schema with the market object; keep a legacy `location` string accepted and coerced.
- `src/lib/onboarding.server.ts`: swap `Where: ${seed.location}` for the multi-line market summary and mention footprint explicitly in the specialization instruction.
- `src/routes/intake.tsx`: new `MarketFields` block using the existing themed select/input styles, chip add/remove for service areas, and toggle chips for regions.
- `src/routes/draft.tsx` and `src/routes/forks.tsx`: replace the single `location` known-answer row with rows derived from the market.
- Database: no migration required — `businesses.location` keeps the summary string. If we later want to query by region, that's a separate migration.
