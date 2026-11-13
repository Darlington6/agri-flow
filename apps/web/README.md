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

## Building for every device

Every screen has to work on phones, tablets and desktops. Build mobile-first (base styles for small
screens, then `sm:`/`md:`/`lg:` upwards), keep touch targets at least 44px, and check new UI at phone width
(~375px) as well as desktop before opening a PR.
