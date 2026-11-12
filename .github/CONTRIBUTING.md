# Contributing

## Branching and promotion

```
feature/*  ──squash──▶  dev  ──merge──▶  staging  ──merge──▶  main (production)
                         ▲                                      │
                         └────────── back-merge (merge) ────────┘
hotfix/*  ──merge──▶  main, then back-merge main → staging and main → dev
```

| Target    | Accepts PRs from                    | Merge method      |
|-----------|-------------------------------------|-------------------|
| `dev`     | any branch (feature, Dependabot, back-merges) | **Squash**  |
| `staging` | `dev`, `main` (back-merge), `hotfix/*` | **Merge commit** |
| `main`    | `staging`, `hotfix/*`               | **Merge commit**  |

- Branch off `dev` for new work: `git switch -c feat/short-description dev`. Name the branch after the
  Conventional Commit type (`feat/`, `fix/`, `chore/`, `docs/`, ...).
- Open your PR **against `dev`**. Promotions (`dev` → `staging` → `main`) are their own PRs, opened once
  what's on the source branch is ready to move forward. Never skip `staging`.
- **Why squash into `dev`:** one commit per feature, and the PR title becomes that commit's message, so
  PR titles must be Conventional Commits (checked by CI, see below).
- **Why merge commits for promotions:** a squash or rebase would rewrite `dev`'s commits as new ones on
  `staging`/`main`, and the branches would then disagree about history on every later promotion. A merge
  commit keeps the same commits on all three branches.
- **Back-merge after anything lands on `main` that didn't come through `dev`** (hotfixes, a stray direct
  change): open a PR `main` → `dev` (and `main` → `staging` if staging also lacks it), merged with a merge
  commit. Promotion merge commits alone don't need back-merging: they carry no content, so GitHub
  showing `dev` as "behind" by only those merge commits is expected and harmless.
- Merged head branches are deleted automatically. `dev`, `staging` and `main` can never be deleted (see
  below), so promotion PRs leave them in place.

### What's enforced

The `protected-branches` ruleset on `dev`, `staging` and `main` (no bypass, admins included):

- No deletion, no force-push.
- Changes only through pull requests.
- Required status checks: `web (lint, typecheck, build)` and `api (lint, check, test)` from `ci.yml`, plus
  `branch flow` and `conventional PR title` from `pr-policy.yml`.
- `dev` additionally requires the PR branch to be up to date with `dev` before merging, so CI always ran
  against what will actually land. This isn't required on `staging`/`main`: there it would force merging
  `staging` back into `dev` through a branch that only accepts PRs.

Rulesets can require a PR but can't restrict which branch it comes from. `pr-policy.yml` closes that gap:
`branch flow` fails a PR whose source isn't allowed for its target (table above).

## Deployments

Deployment is Vercel's Git integration, configured by [`vercel.json`](../vercel.json) at the repo root
(two services: `apps/api` as Django, `apps/web` as Vite; `/api/*` and `/admin*` route to the API).

- Push to `main` → **Production** deployment.
- Push to any other branch, including `staging` and `dev` → **Preview** deployment, with a per-branch URL
  shown in the PR. Previews are behind Vercel Authentication.
- There is no GitHub Actions deploy workflow. Because `main` only accepts PRs that passed CI, everything
  Vercel deploys to production has already passed CI.

Vercel installs the API from `apps/api/requirements.txt`, which CI keeps identical to `poetry.lock`
(see `apps/api/README.md`). Python is pinned by `apps/api/.python-version`.

## Dependencies (Dependabot)

Configured in [`dependabot.yml`](dependabot.yml), all targeting `dev`, weekly:

- Minor and patch updates are **grouped**: one PR per ecosystem (web runtime, web dev, API runtime, API
  dev, GitHub Actions). Major updates still arrive one PR each, because they need a real look.
- **Django majors are ignored** until a deliberate upgrade: `pyproject.toml` caps `django<6.0`, and DRF,
  simplejwt, drf-spectacular and django-cors-headers all need to support the new major first. When it's
  time, do it as a normal `feat/` or `chore/` branch: raise the cap, `poetry lock`, regenerate
  `requirements.txt`, run the tests.
- A Dependabot PR that fails CI because of a version cap is closed, not merged around. Comment
  `@dependabot ignore this major version` (or `minor`) on it so it isn't reopened.
- Merge passing grouped PRs as they come; if several conflict on `poetry.lock`/`pnpm-lock.yaml`, comment
  `@dependabot rebase` on the rest after each merge.

## Local setup

```bash
pnpm install
pnpm dev              # apps/web dev server
docker compose up     # full stack: postgres, redis, api, celery, web
```

See `apps/web/README.md` and `apps/api/README.md` for app-specific detail.

## Code style

- **Modularity is a hard rule, not a preference**: one file, one concern. A bounded context in `apps/api`
  is a folder of small, focused files, never one large `views.py`/`models.py` carrying everything for
  that context.
- Frontend: `oxlint` (`pnpm lint`), TypeScript strict mode (`pnpm typecheck`).
- Backend: `ruff check` and `ruff format` (both enforced), Django's own `manage.py check`.
- Everything runs in CI on every PR. Fix it locally before pushing, don't rely on CI to find it first.
  Run the API tests against Postgres (`docker compose up -d postgres redis`), the same as CI.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, body as bullet
points explaining what changed and why, not a diff summary.

```
fix(api): reject expired OTP codes instead of silently accepting them

- OtpCode.expires_at was being set but never checked in verify_otp()
- Added the expiry check, plus a test covering it
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, `perf`, `style`, `revert`.
Scope is usually the app or area touched (`api`, `web`, `identity`, `ci`, `deps`, ...); omit it for
something repo-wide. The same format applies to **PR titles**, since squash-merging into `dev` turns the
title into the commit. Promotion PRs too, e.g. `chore(release): promote dev to staging`.

No `Co-Authored-By` trailers for AI assistance; if a change was AI-assisted, that's a PR-description
detail, not a commit trailer.

## Where the bigger picture lives

This file documents what exists. The **Platform Blueprint** (shared separately, not checked into this
repo) covers the full architecture this is building toward: bounded contexts, multi-market/currency
model, auth, the reasoning behind decisions like Django over Node or shared-schema multi-tenancy. Read it
before proposing a structural change; it usually already covers the tradeoff.
