# @agriflow/web

The AgriFlow platform frontend — see the [root README](../../README.md) for what this app actually is
(the prototype, its features, its limitations). This file is just how to run it.

```bash
pnpm --filter @agriflow/web dev            # dev server, http://localhost:5173
pnpm --filter @agriflow/web run build      # typecheck + production build
pnpm --filter @agriflow/web run lint
pnpm --filter @agriflow/web run typecheck
```

Or from the repo root, via Turborepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

Use **Node 24** (`.nvmrc` at the repo root): `nvm use` or `fnm use`. Vitest doesn't start on Node 26 yet.

## Tests

[Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
and jsdom. Tests sit next to the code they test, named `*.test.ts` / `*.test.tsx`.

```bash
pnpm --filter @agriflow/web test             # run once (what CI runs)
pnpm --filter @agriflow/web test:watch       # re-run on save
pnpm --filter @agriflow/web coverage         # coverage report in apps/web/coverage/
```

- Test behaviour the user sees: query by role and accessible name (`getByRole('button', { name: … })`),
  not by CSS class or test IDs.
- Anything involving dates must hold in every time zone the product serves. `src/lib/date.test.ts`
  runs its cases in UTC, West Africa, Rwanda and East Africa; follow that pattern.

## Dates and times

Two different things, handled differently:

- **Calendar dates** (a harvest date, a delivery day) are the same day for everyone. Keep them as
  `'YYYY-MM-DD'` strings and do arithmetic with `src/lib/date.ts`, which calculates in UTC so the device's
  time zone can't shift the day.
- **Moments** (a message sent, a payment made) are stored as full ISO timestamps in UTC (`…Z`), which is
  what the API stores, and shown in the viewer's own time zone with `Intl.DateTimeFormat`. 13:40 UTC
  shows as 13:40 in Accra, 15:40 in Kigali and 16:40 in Nairobi; 23:40 UTC on Friday shows as 01:40
  Saturday in Kigali.

## Colours

The palette lives in `packages/design-tokens/src/theme.css` (imported by `src/index.css`); never define
colours in this app. Pick colours by role, not by look:

| Role | Use | Examples |
|---|---|---|
| `primary` (teal) | Anything you can tap | Buttons, links, selected nav/filters, focus rings |
| `brand` (forest) | Identity | Icon chips, avatars, headings, dark cards, chart series |
| `gold` | Warm highlight, sparingly | The pilot tag |
| `sage` | Soft surfaces | Progress tracks, soft panels |
| `ink` | Text, borders, backgrounds | Body text, dividers |
| `chat-own` | Your own chat bubbles | Contract chat, AI Copilot (the original AgriFlow green, kept on purpose) |
| `status-*` | Meaning: good, warning, risk, info | KYC badges, risk levels, timeline ticks: keep these conventional |

The logo's gold and sage are too light for text on white; use them as fills and their `700`+ shades for
text. `src/test/tokens.test.ts` fails if a palette change drops a key pairing below WCAG AA contrast.

## Places

Locations are structured (`Place`: name, administrative area, ISO country code), never free text, so
matching works across countries: regions in Ghana, provinces in Rwanda, counties in Kenya. Compare and
format them with `src/lib/places.ts`; never match place names by substring.
- Test files are type-checked by `tsconfig.test.json` (Node types available); app code by
  `tsconfig.app.json` (no Node types, so app code can't depend on Node by accident).

The platform screens run from `src/data/` mock fixtures and need no backend. Real sign-in (`/signin`, `/account`,
`/magic-link`) calls the API at `VITE_API_URL` (see `.env.example`; defaults to `http://localhost:8000` in
dev). Start it with `docker compose up -d postgres redis api` from the repo root.

## Building for every device

Every screen has to work on phones, tablets and desktops. Build mobile-first (base styles for small
screens, then `sm:`/`md:`/`lg:` upwards), keep touch targets at least 44px, and check new UI at phone width
(~375px) as well as desktop before opening a PR.
