# Contributing

## Branching

`feature/*` → `dev` → `staging` → `main` (production). `hotfix/*` branches off `main` directly for
urgent production fixes, then merges back into `main`, `staging`, and `dev` so nothing drifts.

- Branch off `dev` for new work: `git checkout -b feature/short-description dev`.
- Open your PR **against `dev`**, not `staging` or `main`.
- `dev` → `staging` → `main` promotions happen as their own PRs, once what's in `dev` is ready to move
  forward — not something an individual feature PR does.
- CI (`.github/workflows/ci.yml`) must pass before any of these merge.

## Local setup

```bash
pnpm install
pnpm dev              # apps/web dev server
docker compose up     # full stack: postgres, redis, api, web
```

See `apps/web/README.md` and `apps/api/README.md` for app-specific detail.

## Code style

- **Modularity is a hard rule, not a preference**: one file, one concern. A bounded context in `apps/api`
  is a folder of small, focused files, never one large `views.py`/`models.py` carrying everything for
  that context.
- Frontend: `oxlint` (`pnpm lint`), TypeScript strict mode (`pnpm typecheck`).
- Backend: `ruff` (`poetry run ruff check .`), Django's own `manage.py check`.
- Both run in CI on every PR — fix locally before pushing, don't rely on CI to find it first.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, body as bullet
points explaining what changed and why — not a diff summary.

```
fix(api): reject expired OTP codes instead of silently accepting them

- OtpCode.expires_at was being set but never checked in verify_otp()
- Added the expiry check, plus a test covering it
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`. Scope is usually the app or area
touched (`api`, `web`, `identity`, `ci`, ...) — omit it for something repo-wide. No `Co-Authored-By`
trailers for AI assistance; if a change was AI-assisted, that's a PR-description detail, not a commit
trailer.

## Where the bigger picture lives

This README documents what exists. The **Platform Blueprint** (shared separately, not checked into this
repo) covers the full architecture this is building toward — bounded contexts, multi-market/currency
model, auth, the reasoning behind decisions like Django over Node or shared-schema multi-tenancy. Read it
before proposing a structural change; it usually already covers the tradeoff.
