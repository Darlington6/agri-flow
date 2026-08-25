# AgriFlow

**Climate-Smart Demand-to-Farm Platform.** Turn agricultural demand into reliable, climate-smart supply.

This is an early-stage, high-fidelity **prototype**. It has no backend, no real users, and no live data —
every farmer, buyer, contract, climate figure and financial number in this app is simulated demonstration
data, built to tell one coherent, connected story end to end.

## The problem

Agricultural production and market demand are poorly coordinated. Smallholder farmers often produce
without reliable knowledge of future demand, while institutional buyers — food processors, hotels,
restaurants, supermarkets, aggregators, exporters — struggle to secure predictable volumes, quality and
delivery.

AgriFlow reverses the traditional model. Instead of farmers producing and hoping to find a buyer, verified
buyer demand drives production planning:

```
Buyer Demand → Contracts → Production → Climate Intelligence → Harvest Forecast
  → Post-Harvest Coordination → Delivery → Payment → Performance Data
```

AgriFlow is not a farmer marketplace, an e-commerce app, a weather app, a farm-management app, a lending
app, or a cold-storage marketplace. It is the coordination layer that connects those capabilities around
verified demand and production contracts.

## Target users

- **Institutional buyers** — predictable supply, quality, delivery visibility, supplier management, traceability.
- **Farmers** — reliable demand, production contracts, climate-risk information, harvest coordination, reliable payment.
- **Field agents / agronomists** — farmer monitoring, field visits, climate-smart-practice verification, issue reporting.
- **Platform operations** — supply visibility, contract management, harvest forecasting, risk alerts, payment tracking.

## Product architecture

Single Vite + React + TypeScript application, structured so a real backend can be dropped in without
touching the UI layer:

```
src/
  types/        Domain types shared across the app (Farmer, Buyer, Contract, ClimateRisk, Payment, ...)
  data/         Mock data fixtures + selector functions — the ONLY place seed data lives
  services/ai/  AIService interface + MockAIService implementation (swap for an LLM-backed service later)
  components/   Layout shell, shared UI primitives, chart components, contract/matching components
  pages/        One component per route
  context/      SessionContext (demo auth) and PlatformDataContext (live in-memory platform state)
  config/brand.ts  Single source of truth for product name/claims, so the brand can be renamed easily
```

Mock data is never hardcoded inside components — every page reads from `src/data/`, which exposes typed
fixtures and small selector functions (`contractsByBuyer`, `farmersByContract`, etc.), mirroring the shape
a real API client would expose.

Anything a user can actually change at runtime (confirming a match, sending a chat message, posting a
marketplace listing, assigning a delivery partner, approving KYC) lives in `PlatformDataContext`, not in
component state — it's seeded from the `src/data/` fixtures and exposes action functions (`requestToSupply`,
`confirmMatchRequest`, `sendMessage`, ...), the same shape a real API client's mutations would take. Every
scope function in `src/lib/scope.ts` and lookup helper in `src/data/` accepts an optional "live list"
argument so pages can pass through the current context state instead of the static seed.

## AI architecture

The AI Copilot (`/copilot`) and the AI cards on the dashboard/contract pages are built against an
`AIService` interface (`src/services/ai/AIService.ts`), not hardcoded into components. The current
implementation, `MockAIService`, generates responses from the structured mock dataset using lookups and
templates — no model call. Swapping in a real LLM later means writing an `LLMAIService` that implements
the same interface; no UI code changes.

The AI is scoped to four jobs against platform data (farmers, contracts, production, harvest forecasts,
climate risk, buyers, payments, post-harvest capacity):

- **Prediction** — what is likely to happen (fulfillment, yield, delivery)
- **Detection** — what is going wrong right now (risk, gaps, missed updates)
- **Recommendation** — what action would address it
- **Explanation** — why a prediction or detection is happening

Farmer Copilot, Buyer Copilot, Operations Copilot, Climate Copilot and production-based Finance
Intelligence are shown as "Coming soon" in the UI — they are not implemented.

## Role-based access

The six demo roles are not just labels — each is scoped to a distinct nav and dataset, computed in
`src/lib/scope.ts` and `src/lib/permissions.ts`. A route or record outside a role's scope isn't just
hidden from the sidebar — `AppLayout` guards every route against the current role's permissions, and
detail pages additionally guard against out-of-scope individual records (e.g. a buyer trying another
buyer's contract, or a field agent trying a farmer outside their assigned regions), redirecting rather
than rendering.

- **Platform Admin** — full operational nav, unscoped access to every buyer, farmer, contract and
  financial record. This is the day-to-day ops role.
- **Super Admin** — everything Platform Admin has, plus an Executive view (profit/revenue, take rate,
  network growth) that ops staff don't need day to day. `src/lib/permissions.ts` expresses this as
  additive rather than a separate parallel role: `isAdminRole(role)` treats Platform Admin and Super
  Admin as equivalent everywhere except the Executive route, so the two never drift out of sync as
  admin-only features are added.
- **Buyer** — logged in as a specific buyer (Ghana Fresh Foods Ltd. in this demo). Sees only their own
  demand requests, contracts, harvest forecasts, payments and risk alerts. Farmers and Production are not
  in their nav or reachable directly.
- **Farmer** — logged in as a specific farmer (Abena Owusu, one of the growers on contract AG-204 — the
  same contract the demo Buyer and Field Agent are connected to). Their dashboard is a personalized view
  of their own contract, expected harvest, climate-smart practice score and payment history. "Farmers" in
  their nav goes straight to their own profile rather than a directory; Demand, Production and Finance
  aren't reachable at all.
- **Field Agent** — assigned to a set of regions (Bono, Bono East, Ashanti in this demo). Sees only
  farmers, production cycles, harvests and climate risk within those regions. Demand, Contracts and
  Finance are not in their nav or reachable directly.
- **Delivery Partner** — logged in as a specific delivery partner (Kwabena, an individual mover in this
  demo, tied into the same AG-204 story as the other roles). Sees only their own Job Board: available
  jobs ranked for them, and the jobs they've booked. No access to farmers, contracts, or financial data
  beyond their own delivery fees.

## Interactive features

Beyond the read-only dashboards, the platform implements the actual demand-to-contract workflow and a few
adjacent features requested for a more complete pilot story:

- **Demand → contract matching.** A Farmer's dashboard shows "Open Opportunities" — contracts that still
  need volume — and lets them submit a `MatchRequest` with a proposed quantity. A Buyer or Admin reviews
  pending requests on the contract's detail page and can confirm or decline them; confirming updates the
  contract's supplied quantity and farmer list, updates the parent demand request's status, and generates
  the farmer's production cycle and harvest forecast — the same records a pre-seeded matched farmer has.
  This is the one interactive flow that proves the "demand drives production" loop end to end, rather than
  only showing contracts where matching has already happened. Confirmation authority is currently Platform
  Admin **or** Buyer, as a pragmatic pilot-stage simplification (ops staff mediating matches is realistic
  early on). The longer-term product view is that this should narrow to just the parties actually involved
  in the contract — the buyer accepting or declining a farmer's offer directly, with Admin visibility but
  not approval authority — revisit this once the pilot shows whether buyers want to act on every request
  themselves or lean on ops to triage.
- **KYC.** Farmers and buyers carry a `kycStatus` (Unverified / Pending / Verified), shown as a badge
  wherever they appear. A Farmer or Buyer can submit for verification from Settings; a Platform Admin
  reviews a Verification Queue and approves or rejects. Verified status feeds the climate-smart insurance
  eligibility badge on a farmer's profile.
- **Marketplace.** A separate flow from contracted demand — Produce Surplus (farmers selling above-contract
  harvest instead of losing it), Farm Inputs (seeds, seedlings, fertilizer, equipment), and Farm Residue
  (crop residue for composters). Farmers and Admin can post listings; any role with marketplace access can
  express interest.
- **Delivery coordination — partner self-booking, not admin assignment.** Delivery partners book their own
  jobs from their own Job Board rather than waiting for an admin to assign them, mirroring how a real
  logistics marketplace works. `src/lib/deliveryScore.ts` implements a simple ranking heuristic (region
  match, partner rating, vehicle-fit) — explicitly a placeholder for a real dispatch algorithm, but wired
  symmetrically both ways: a Delivery Partner sees jobs ranked for them and books directly, while a Buyer
  or Admin sees the same scoring surfaced as read-only "Recommended partners" on the contract's delivery
  card. Admin/Super Admin retain a manual "assign (override)" path for edge cases, but it's explicitly
  labeled as the exception, not the primary flow. Commission per job rolls up into both the Finance page
  and the Executive revenue view.
- **In-contract chat + call.** Once a contract exists, the Buyer, Farmer and Admin can message each other
  from the contract detail page (a real, if ephemeral, per-contract thread). "Call" is an honest stub — it
  shows a brief calling animation, then states that in-app voice is coming soon and surfaces the
  counterparty's phone number instead of pretending to place a real call.
- **Insurance.** Not a real feature yet — a farmer's profile shows a computed "Production Readiness Score"
  (reliability + climate-smart adoption) and an eligibility badge for a future climate-smart insurance
  pilot, with the application flow itself marked "Coming soon."
- **Executive revenue view (Super Admin only).** A separate view from the operational Finance page —
  platform take rate, revenue broken down by source (transaction fees, buyer subscriptions, delivery
  commission, financing referrals — the last two either derived from live in-session data or marked "not
  live yet" rather than faked), and a 6-month network growth trend. Modeled as the kind of internal
  analytics a platform operator needs but that would clutter an ops-focused Admin dashboard — the reason
  for splitting Super Admin out as its own role rather than adding a toggle to Platform Admin.

## Technology stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Recharts
- Lucide React icons

## Repo structure

This is a monorepo (pnpm workspaces + Turborepo), scaffolded per the Platform Blueprint as the first step
of moving from prototype to real implementation:

```
apps/
  web/   the frontend you're reading about below — moved here unchanged, still mock-data only
  api/   Django + DRF backend — currently a bare skeleton (settings, one health endpoint), no
         domain logic yet
packages/
  types/          shared domain types — hand-maintained today, generated from the API's OpenAPI
                  schema once apps/api has real endpoints
  design-tokens/  the locked visual-identity decisions (teal platform chrome, Fraunces/IBM Plex
                  Sans for a future public site) — not yet wired into apps/web
  ui/             empty stub — shared components migrate here deliberately, one at a time
  config/         shared tsconfig/lint base
```

`apps/web` is still exactly the prototype described in this README — nothing below changed because of
the restructure. `apps/api` and `packages/*` exist so the real build has somewhere to grow into; see the
Platform Blueprint for the full architecture this is working toward.

## Running locally

**Just the prototype** (what this README otherwise describes):

```bash
pnpm install
pnpm --filter @agriflow/web dev     # start the dev server
pnpm --filter @agriflow/web run build
```

No environment variables or external services are required for this — everything runs from local mock
data, same as always.

**The full stack** (Postgres, Redis, the Django API, and a production build of the web app):

```bash
docker compose up
# api:   http://localhost:8000/api/v1/health/
# web:   http://localhost:4173
```

`apps/api` has no real domain endpoints yet — this proves the container and database wiring, nothing
more. `cp apps/api/.env.example apps/api/.env` if you want to run the API outside Docker.

## Current prototype limitations

- No real authentication — `/login` is a role picker that sets a local session, nothing more.
- No backend — all data lives in `PlatformDataContext`, seeded from `src/data/`, and resets on reload. New
  demand requests, confirmed matches, chat messages, marketplace listings, delivery assignments and KYC
  status changes all persist for the session (they behave identically across every page while you're using
  the app) but are lost on refresh, just like the pattern already noted for demand request creation.
- No live weather/satellite integration — climate figures are illustrative mock data.
- No live payment processing — MTN Mobile Money, Telecel Cash, AirtelTigo Money and Bank Transfer are
  shown as planned channels only.
- No real chat/voice infrastructure — messaging is a real per-contract thread but stored only in memory;
  "Call" is a UI stub, not a VoIP integration.
- The Farmer Network page shows a representative sample of farmers; network-wide KPI tiles (e.g. "384
  active farmers") represent the full simulated pilot network, not literally every record in the sample.
- The delivery ranking in `src/lib/deliveryScore.ts` is a simple, explicitly-labeled heuristic (region
  match + rating + vehicle fit), not a real dispatch/logistics optimization algorithm.
- Executive revenue figures (`src/data/executive.ts`) are illustrative mock data for the growth trend and
  subscription line; only the delivery-commission figure is derived from live in-session bookings.

## Planned production architecture

Decided and underway — see `apps/api` above and the Platform Blueprint for the full picture:

- **Django + Django REST Framework**, serving the shapes currently hand-defined in `apps/web/src/types/`
  (and mirrored in `packages/types/`) — those become generated from the API's OpenAPI schema rather than
  hand-maintained, once real endpoints exist.
- Real authentication (phone-number OTP + email magic links as first-class, not just password) and
  server-side role-based access control, in place of the demo session context.
- Integration with a weather/satellite data provider for `ClimateRisk` data.
- Integration with MTN MoMo, Telecel Cash and AirtelTigo Money APIs for real payment processing.
- An `LLMAIService` implementation of the existing `AIService` interface.
- A real delivery-dispatch/optimization service behind the same `rankPartnersForJob` / `rankJobsForPartner`
  interface, replacing the current heuristic without changing how the UI consumes it.
- A real analytics/reporting pipeline behind the Executive view, replacing the mock revenue and growth
  trend data with computed figures from actual transaction and subscription records.

All current agricultural, financial and network metrics in this prototype are simulated demonstration
data for evaluation purposes — not real farmers, buyers, contracts, revenue or impact.
