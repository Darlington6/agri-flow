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

## Building for every device

Every screen has to work on phones, tablets and desktops. Build mobile-first (base styles for small
screens, then `sm:`/`md:`/`lg:` upwards), keep touch targets at least 44px, and check new UI at phone width
(~375px) as well as desktop before opening a PR.
