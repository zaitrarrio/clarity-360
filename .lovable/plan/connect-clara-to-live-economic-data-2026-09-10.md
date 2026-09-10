# Connect Clara to live economic data

## Goal
Give Clara verifiable, current context from authoritative public datasets instead of letting her estimate market facts.

## What will change
- Add a server-only indicator service that fetches and normalizes:
  - U.S. Census American Community Survey data for local population, households, income, employment, and internet access when the plan includes a U.S. ZIP code.
  - U.S. Census County Business Patterns data for industry establishment, employment, and payroll benchmarks using the plan’s industry classification.
  - U.S. Bureau of Labor Statistics data for current national inflation, unemployment, earnings, and industry employment trends.
- Add Clara tools for looking up location, industry, and economic indicators during a conversation.
- Give each result a source name, official source URL, geography, observation period, and retrieval date.
- Update Clara’s instructions so she distinguishes plan facts from external facts, cites external claims inline, never fills missing observations with guesses, and states when no authoritative match is available.
- Use graceful fallbacks: a missing or unsupported location will still return national and industry indicators rather than breaking chat.

## Files and behavior
- `src/lib/economic-data.server.ts`: API clients, industry-to-NAICS mapping, parsing, validation, timeouts, and normalized indicator results.
- `src/routes/api/clara.ts`: expose the indicator lookup as a Clara tool and include the business location/industry in its lookup context.
- `src/lib/clarity.server.ts`: strengthen Clara’s evidence and citation rules; allow generated business artifacts to use the same live indicator context where relevant.
- Add focused tests for API response normalization and citation formatting if the project’s current test setup supports them.

## Technical notes
- Calls stay server-side and use official HTTPS APIs; no private credential is required for the initial sources.
- The first version is U.S.-focused because the current intake accepts U.S. ZIP/city service areas. Online/global businesses receive U.S. national baselines unless a supported U.S. market is present.
- External API failures are isolated and returned as data-availability notes, never invented values.

## Validation
- Ask Clara for the local market size, industry conditions, and current economic context.
- Confirm returned figures include source links and dates.
- Confirm unsupported locations and temporary upstream failures produce a clear limitation rather than a fabricated answer.
- Confirm authenticated Clara chat and action generation still work.
