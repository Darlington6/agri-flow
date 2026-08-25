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

No environment variables or backend required — everything runs from `src/data/` mock fixtures.
