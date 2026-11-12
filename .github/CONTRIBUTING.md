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
| `dev`     | any branch (feature, Dependabot, back-merges) | **Squash** (merge commit for back-merges only) |
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

Two rulesets (Settings → Rules → Rulesets), both active with no bypass, admins included:

| Ruleset | Branches | Merge methods allowed | Branch must be up to date |
|---|---|---|---|
| `dev` | `dev` | squash, merge | yes |
| `protected-branches (staging, main)` | `staging`, `main` | merge only | no |

Both rulesets:

- Block deletion and force-push.
- Allow changes only through pull requests (0 approvals required while this is a single-maintainer repo).
- Require four status checks: `web (lint, typecheck, build)` and `api (lint, check, test)` from `ci.yml`,
  plus `branch flow` and `conventional PR title` from `pr-policy.yml`.

Notes on those choices:

- `dev` allows merge commits only because back-merges from `main` need them. Rulesets can't vary the
  method by source branch, so feature PRs are squash-merged by convention, not enforcement.
- "Up to date" on `dev` means CI always ran against what will actually land. It's off for `staging` and
  `main`, because there it would force merging `staging` back into `dev` through a branch that only accepts
  PRs.

Repository merge settings: squash and merge commits both take the **PR title** as the commit title and the
PR description as the body. That's why PR titles must be Conventional Commits; the default
`Merge pull request #n from ...` title isn't one.

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

Vercel installs the API from `apps/api/pyproject.toml` + `apps/api/uv.lock`, the same lock CI and the
Dockerfile use, so production runs exactly the versions CI tested. Python is pinned by
`apps/api/.python-version`.

## Dependencies (Dependabot)

Configured in [`dependabot.yml`](dependabot.yml), all targeting `dev`, weekly:

- Minor and patch updates are **grouped**: one PR per ecosystem (web runtime, web dev, API runtime, API
  dev, GitHub Actions). Major updates still arrive one PR each, because they need a real look.
- **Held for deliberate upgrades** (ignored by Dependabot, each done as its own `chore/` branch when
  it's time):

  | What | Held at | Why |
  |---|---|---|
  | Django major | 5.x | `pyproject.toml` caps `django<6.0`; DRF, simplejwt, drf-spectacular and django-cors-headers must support 6 first |
  | Python (API Docker image) | 3.12 | Pinned in `.python-version`, CI and Vercel; moves everywhere at once |
  | Node major (web Docker image) | 20 | Moves CI, Docker and `@types/node` together |
  | TypeScript major | 6.x | TypeScript 7 is the new native compiler |
  | `@types/node` major | follows Node | Must match the Node version that actually runs |

  For a Django upgrade: raise the cap in `pyproject.toml`, `uv lock`, run the tests.
- API updates come from Dependabot's `uv` ecosystem, which updates `pyproject.toml` and `uv.lock`
  together. There's only one lock file, so nothing needs regenerating by hand.
- A Dependabot PR that fails CI because of a version cap is closed, not merged around. Comment
  `@dependabot ignore this major version` (or `minor`) on it so it isn't reopened.
- Merge passing grouped PRs as they come; if several conflict on `uv.lock`/`pnpm-lock.yaml`, comment
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
