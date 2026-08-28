# Multi-tenant white labeling for Clarity 360

One codebase serving many branded deployments. A tenant is an isolated workspace with its own branding, its own businesses, and its own members. Every plan, agent run, signal, and conversation belongs to exactly one tenant.

## How a tenant is resolved

1. **Host match first** — `acme.clarity360.app` or a custom domain like `plan.acme.com` resolves to the tenant whose domain record matches the request host.
2. **Path prefix fallback** — `/t/acme/...` works everywhere, including previews and before DNS is set up.
3. **No match** — the default Clarity 360 tenant (current branding, existing demo business).

Resolution happens server-side during SSR so the correct name, logo, and colors are in the first paint — no flash of Clarity 360 branding on a partner site.

## Membership and roles

- A user can belong to several tenants; within a tenant they hold a role: `owner`, `admin`, or `member`.
- A business belongs to one tenant. Business-level roles (`owner`, `editor`, `viewer`) decide who can edit a given plan; tenant admins can see every business in their tenant.
- Signing up on a branded host joins that tenant automatically as a `member` (invite-only can be toggled per tenant).
- A separate platform-admin role can provision tenants and impersonate nothing — it only manages tenant records.

## What each tenant can white-label

- **Identity** — product name, wordmark/logo, favicon, footer text.
- **Theme** — primary/accent colors, surface colors, display and body font pairing. Stored as token overrides and injected as CSS variables on the tenant's pages.
- **Language** — Clara's display name, each domain agent's name, hero and landing copy, intake framing text.
- **Domain and email** — a verified custom domain plus a sender name/address for outbound mail.

Anything a tenant leaves unset falls back to the Clarity 360 defaults, so a new tenant works immediately with just a name.

## Admin surfaces

- **Platform admin** (`/admin/tenants`) — create tenants, set slug and domain, assign the first owner, suspend.
- **Tenant settings** (`/settings/branding`, `/settings/members`) — tenant owners/admins edit branding, copy, agent names, and manage members and invites.

## Isolation

Every tenant-scoped table carries `tenant_id`, and read/write access requires membership in that tenant — enforced in the database, not just in the UI. Server functions and the Clara chat endpoint re-derive the tenant from the request and the caller's membership rather than trusting anything sent from the browser, so one tenant's data can never be reached from another's host.

## Technical section

**Database (one migration)**
- `tenants` — slug, name, status, branding jsonb (logo url, colors, fonts, copy overrides, agent name overrides), email_from_name/address, created_at/updated_at + trigger.
- `tenant_domains` — tenant_id, host (unique), verified flag, is_primary.
- `tenant_members` — tenant_id, user_id, role enum (`owner|admin|member`), unique (tenant_id, user_id).
- `business_members` — business_id, user_id, role enum (`owner|editor|viewer`).
- `platform_admins` — user_id (separate table, never a column on a profile).
- `businesses.tenant_id` added (not null, backfilled to the default tenant); same column added to plan_sections/actions/action_runs/agent_schedules/agents/signals/conversations/messages/intake_responses/plan_progress for direct scoping.
- Security-definer helpers: `is_tenant_member(_tenant, _user)`, `tenant_role(_tenant, _user)`, `has_business_access(_business, _user)`, `is_platform_admin(_user)`.
- RLS rewritten on all existing tables to go through these helpers instead of `businesses.user_id`; demo rows stay readable via the default tenant's `is_demo` path. GRANTs re-issued for every new table.
- Seed the default `clarity360` tenant and attach the existing demo business.

**Server**
- `src/lib/tenant.server.ts` — `resolveTenant()` reads the request host (`getRequestHeader('host')`) then falls back to the `/t/$slug` segment; returns tenant record + branding, cached per request.
- Root route loader calls a public `getTenant` server fn and puts branding in router context; `__root.tsx` renders tenant CSS variables in a `<style>` tag and tenant title/favicon in `head()`.
- `assertBusinessAccess` in `clarity.server.ts` extended: business must belong to the resolved tenant and the caller must have business access (demo business stays open on the default tenant only).
- `intake.server.ts` `buildPlan` writes `tenant_id` from the resolved tenant and inserts a `business_members` owner row; agent names come from tenant overrides.
- `progress.functions.ts` scoped by tenant as well as user.

**Client**
- `src/lib/tenant.ts` — `useTenant()` hook + `agentName(key)` / `brandName()` helpers reading context overrides with defaults from `clarity.ts`.
- `AppHeader.tsx` `Logo` and `index.tsx` hero/landing copy read from tenant branding instead of hardcoded "Clarity 360".
- `AGENT_NAMES` / `DOMAINS` usage routed through the override helper.
- Route group `/t/$slug` mirrors existing routes via a pathless layout that sets the slug in context; host-resolved tenants use the plain paths unchanged.
- New routes: `/settings/branding`, `/settings/members` (tenant admin), `/admin/tenants` (platform admin), all under the authenticated gate with server-side role checks in their server functions.

**Out of scope for this pass**: automated DNS/TLS provisioning for custom domains (records are stored and matched; pointing the domain is a manual step) and per-tenant billing.
