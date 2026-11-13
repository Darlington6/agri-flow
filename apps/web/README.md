# @agriflow/web

The AgriFlow platform frontend — see the [root README](../../README.md) for what this app actually is
(the prototype, its features, its limitations). This file is just how to run it.

```bash
pnpm --filter @agriflow/web dev            # dev server, http://localhost:5173
pnpm --filter @agriflow/web run build      # typecheck + production build
pnpm --filter @agriflow/web run lint
pnpm --filter @agriflow/web run typecheck
```

Or from the repo root, via Turborepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`.

The platform screens run from `src/data/` mock fixtures and need no backend. Real sign-in (`/signin`, `/account`,
`/magic-link`) calls the API at `VITE_API_URL` (see `.env.example`; defaults to `http://localhost:8000` in
dev). Start it with `docker compose up -d postgres redis api` from the repo root.

## Building for every device

Every screen has to work on phones, tablets and desktops. Build mobile-first (base styles for small
screens, then `sm:`/`md:`/`lg:` upwards), keep touch targets at least 44px, and check new UI at phone width
(~375px) as well as desktop before opening a PR.
