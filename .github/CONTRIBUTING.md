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
| `dev`     | any branch (feature, Dependabot, back-merges) | **Squash only** (enforced) |
| `staging` | `dev`, `main` (back-merge), `hotfix/*` | **Merge commit** |
| `main`    | `staging`, `hotfix/*`               | **Merge commit**  |

- Branch off `dev` for new work: `git switch -c feat/short-description dev`. Name the branch after the
  Conventional Commit type (`feat/`, `fix/`, `chore/`, `docs/`, ...).
- Open your PR **against `dev`**. Promotions (`dev` → `staging` → `main`) are their own PRs, opened once
  what's on the source branch is ready to move forward. Never skip `staging`.
- **Opening a promotion:** use these links. They open the PR with the title and the promotion description
  already filled in:
  - [Promote `dev` → `staging`](https://github.com/Darlington6/agri-flow/compare/staging...dev?quick_pull=1&template=promotion.md&title=chore(release):%20promote%20dev%20to%20staging)
  - [Promote `staging` → `main`](https://github.com/Darlington6/agri-flow/compare/main...staging?quick_pull=1&template=promotion.md&title=chore(release):%20promote%20staging%20to%20main)

  If you open one from the normal "New pull request" page instead, GitHub prefills the title with the
  branch name ("Dev"). That's fine: create it as is, and the `conventional PR title` check renames it
  within a few seconds (see [Commits](#commits)).
- **Updating a PR branch:** on a PR into `dev`, "Update branch" merges `dev` into your branch (its dropdown
  also offers "Update with rebase"). Either is fine: the squash merge collapses everything into one commit.
  **Never click "Update branch" on a promotion PR** (`dev` → `staging`, `staging` → `main`). There it would
  push `staging` into `dev` directly, which the `dev` ruleset rejects ("Changes must be made through a pull
  request"). Promotions don't need it: `staging` and `main` don't require the branch to be up to date.
- **Merge button greyed out on a promotion PR after checks pass?** Refresh the page. The title check
  renames the PR while the page is open, and GitHub's merge box doesn't always update after that. A
  reload shows the current state, and "Create a merge commit" becomes available.
- **Why squash into `dev`:** one commit per feature, and the PR title becomes that commit's message, so
  PR titles must be Conventional Commits (checked by CI, see below).
- **Why merge commits for promotions:** a squash or rebase would rewrite `dev`'s commits as new ones on
  `staging`/`main`, and the branches would then disagree about history on every later promotion. A merge
  commit keeps the same commits on all three branches.
- **Back-merge after anything lands on `main` that didn't come through `dev`** (hotfixes, a stray direct
  change): open a PR `main` → `dev` (and `main` → `staging` if staging also lacks it). A back-merge needs a
  **merge commit**, not a squash, so that `dev` gets `main`'s actual commits. Because `dev` is squash-only,
  for that one PR temporarily allow merge commits on the `dev` ruleset (Settings → Rules → Rulesets →
  `dev` → Require a pull request → Allowed merge methods), merge it, then set it back to squash only.
  Promotion merge commits alone don't need back-merging: they carry no content, so GitHub showing `dev` as
  "behind" by only those merge commits is expected and harmless.
- Merged head branches are deleted automatically. `dev`, `staging` and `main` can never be deleted (see
  below), so promotion PRs leave them in place.

### What's enforced

Two rulesets (Settings → Rules → Rulesets), both active with no bypass, admins included:

| Ruleset | Branches | Merge methods allowed | Branch must be up to date |
|---|---|---|---|
| `dev` | `dev` | squash only | yes |
| `protected-branches (staging, main)` | `staging`, `main` | merge only | no |

Both rulesets:

- Block deletion and force-push.
- Allow changes only through pull requests (0 approvals required while this is a single-maintainer repo).
- Require four status checks: `web (lint, typecheck, build)` and `api (lint, check, test)` from `ci.yml`,
  plus `branch flow` and `conventional PR title` from `pr-policy.yml`.

Notes on those choices:

- `dev` is squash-only so every feature or Dependabot PR lands as exactly one commit, titled with its
  Conventional Commit PR title. Merge commits there would also carry every intermediate commit and
  "Merge branch 'dev' into ..." commit through to `staging` and `main`. The rare back-merge is the one
  exception, handled by temporarily allowing merge commits (see above).
- "Up to date" on `dev` means CI always ran against what will actually land. It's off for `staging` and
  `main`, because there it would force merging `staging` back into `dev` through a branch that only accepts
  PRs.

Repository merge settings: squash and merge commits both take the **PR title** as the commit title and the
PR description as the body. That's why PR titles must be Conventional Commits; the default
`Merge pull request #n from ...` title isn't one.

Rulesets can require a PR but can't restrict which branch it comes from. `pr-policy.yml` closes that gap:
`branch flow` fails a PR whose source isn't allowed for its target (table above).

## Deployments

| What | Where | Deploys from |
| --- | --- | --- |
| Web app (`apps/web`) | Vercel project `agri-flow` | `main` → Production; every other branch → Preview |
| Public site (`apps/site`) | Vercel project `agri-flow-site` | `main` → Production; every other branch → Preview |
| API (`apps/api`), production | Render service `agriflow-api`, Frankfurt | `main` |
| API (`apps/api`), staging | Render service `agriflow-api-staging`, Frankfurt | `staging` |
| Database | Neon Postgres, Frankfurt: a `production` branch and a `staging` branch | — |

There is no GitHub Actions deploy workflow. Vercel and Render deploy from Git, and `main` only accepts PRs
that passed CI. Render also waits for a commit's checks to pass before deploying it.

### Web app and site (Vercel)

The `agri-flow` project has its Root Directory set to `apps/web`, configured by
[`apps/web/vercel.json`](../apps/web/vercel.json) (every address serves the app, so reloading `/dashboard`
works). Previews are behind Vercel Authentication.

The app finds the API through `VITE_API_URL`, set in the project's Environment Variables:

- **Production:** `https://agriflow-api.onrender.com` (the production service's address on Render).
- **Preview:** `https://agriflow-api-staging.onrender.com`.

Use the addresses Render shows, without a trailing slash. Render adds a suffix if a name is taken. Vite
builds the value into the app, so redeploy after changing it.

Anything in a `VITE_*` or `PUBLIC_*` variable is copied into the JavaScript every visitor downloads, so it must
never hold a secret. The builds check this: an address that isn't a plain `https://` address (a pasted
database connection string, a path, a password in it) stops the build, and a Vercel build of the app without
`VITE_API_URL` stops too. The check lives in `packages/config/src/publicUrl.ts`.

Both projects send security headers from their `vercel.json`. The app's Content Security Policy only lets the
page load its own files, Google Fonts, the API (`*.onrender.com`) and Vercel's preview toolbar; the site's
policy is a `<meta>` tag Astro writes with hashes of its own inline scripts (`security.csp` in
`apps/site/astro.config.ts`). A new outside service (a font, analytics, a new API domain) has to be added there
first, or the browser blocks it.

**The public site (`apps/site`) is a separate Vercel project** (Root Directory `apps/site`), so it can take
the main domain while the app moves to `app.<domain>`. Setup steps and its environment variables (`SITE_URL`,
`PUBLIC_APP_URL`, `PUBLIC_API_URL`, `PUBLIC_ALLOW_INDEXING`) are in `apps/site/README.md`. Search indexing
stays off until the real domain is live.

### API (Render)

[`render.yaml`](../render.yaml) (a Render Blueprint) describes both services. Each one builds
[`apps/api/Dockerfile`](../apps/api/Dockerfile), the same image as `docker compose`. That image installs the
exact versions in `apps/api/uv.lock`, the same lock CI tests, with Python pinned by `apps/api/.python-version`.
On every start, [`scripts/serve.sh`](../apps/api/scripts/serve.sh) runs `migrate`, then gunicorn. A deploy
with a new migration therefore updates its own database; Render's free plan has no separate pre-deploy step.

A service only redeploys when `apps/api/` or `render.yaml` changes. Both use the **free plan**: they sleep
after 15 minutes without requests, and the next request takes about a minute to wake them. Upgrade
production to Starter (always on) before the pilot depends on it.

The settings (`config.settings.prod`, `config.settings.staging`; both build on
[`deployed.py`](../apps/api/config/settings/deployed.py)) **refuse to start** if any of these is missing:

| Variable | Production | Staging |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | generated by Render | generated by Render |
| `DATABASE_URL` | Neon `production` branch, pooled | Neon `staging` branch, pooled |
| `FRONTEND_URL` (where magic links land) | `https://agri-flow-eight.vercel.app` | the app's `staging` address on Vercel |
| `CORS_ALLOWED_ORIGINS` | the app and the site | the site |
| `CORS_ALLOWED_ORIGIN_REGEXES` (optional) | — | the app's preview addresses |
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys | same key |
| `DEFAULT_FROM_EMAIL` | the sender verified in Brevo, e.g. `AgriFlow <you@gmail.com>` | same |

Render's own address is always allowed as a host. Add any other domain to `DJANGO_ALLOWED_HOSTS`.

Magic links are emailed through Brevo (via django-anymail, so another provider is a settings change).
Brevo sends from one verified address without a domain of our own, but mail from a Gmail address sent
through Brevo can land in spam. Verify a domain in Brevo once we have one. There's no SMS provider yet, so
**phone sign-in answers "not available yet" (503) in staging and production**.

**First-time setup**, in this order:

1. **Neon** (neon.tech): create a project in AWS Europe Central 1 (Frankfurt). Rename its default branch to
   `production`, then create a `staging` branch from it. From each branch's **Connect** dialog, copy the
   **pooled** connection string.
2. **Brevo** (brevo.com): under **Senders, Domains & Dedicated IPs → Senders**, add and verify the address
   emails come from. Under **SMTP & API → API keys**, create a key.
3. **Render** (render.com): **New → Blueprint**, pick this repository, and fill in the values it asks for
   (the table above). Note each service's `onrender.com` address.
4. **Vercel**: set `VITE_API_URL` on the `agri-flow` project (above), and redeploy.
5. **Check:** `https://<api address>/api/v1/health/` answers `{"status": "ok"}`, and `/admin/` shows the
   login page.

**An admin account.** The free plan has no shell, so create it from your machine against the Neon database:

```bash
cd apps/api
DATABASE_URL='<the Neon connection string>' uv run python manage.py createsuperuser
```

People sign up with an email (or, once SMS exists, a phone number) and can add the other later from their
account page. Admin accounts sign in to `/admin/` with a phone number and password, so they need a phone
number.

## Dependencies (Dependabot)

The **Audit** workflow ([`audit.yml`](workflows/audit.yml)) checks every shipped dependency against published
advisories on each PR, each push and every Monday: `pnpm audit` (moderate and above) for the app and site,
`pip-audit` on `uv.lock` for the API. A failure means a known vulnerability: upgrade the package (usually a
patch, e.g. `uv lock --upgrade-package pyjwt`) in its own `fix(deps)` PR rather than waiting for Dependabot.

Configured in [`dependabot.yml`](dependabot.yml), all targeting `dev`, weekly:

- Minor and patch updates are **grouped**: one PR per ecosystem (web runtime, web dev, API runtime, API
  dev, GitHub Actions). Major updates still arrive one PR each, because they need a real look.
- **Held for deliberate upgrades** (ignored by Dependabot, each done as its own `chore/` branch when
  it's time):

  | What | Held at | Why |
  |---|---|---|
  | Django major | 5.x | `pyproject.toml` caps `django<6.0`; DRF, simplejwt, drf-spectacular and django-cors-headers must support 6 first |
  | Python (API Docker image) | 3.12 | Pinned in `.python-version`, CI and Vercel; moves everywhere at once |
  | Node major (web Docker image) | 24 | Moves `.nvmrc` (CI), the web Dockerfile, `engines` (Vercel) and `@types/node` together |
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

## Definition of done

Every change, before its PR is opened:

- **Works on every device kind.** Phones, tablets and desktops (and later the PWA and mobile apps). Build
  mobile-first and check at phone width (~375px) as well as desktop. Say which widths you checked in the
  PR's Testing section.
- **Has tests wherever tests belong.** New API endpoints and services get pytest tests (run against the
  compose Postgres, like CI). New web logic and components get Vitest + Testing Library tests next to
  the file they test (`thing.ts` → `thing.test.ts`). See `apps/web/README.md`.
- **Docs updated** where behaviour or setup changed.

## Code style

- **Modularity is a hard rule, not a preference**: one file, one concern. A bounded context in `apps/api`
  is a folder of small, focused files, never one large `views.py`/`models.py` carrying everything for
  that context.
- Frontend: `oxlint` (`pnpm lint`), TypeScript strict mode (`pnpm typecheck`), Vitest (`pnpm test`).
- Node version: **24**, pinned in `.nvmrc` (CI reads it) and `engines` (Vercel reads it). Use it locally
  too (`nvm use`, `fnm use` or similar). Vitest doesn't start on Node 26 yet.
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
title into the commit.

Promotion and back-merge PRs are titled for you: open them with whatever title GitHub prefills (the
branch name, e.g. "Staging") and the `conventional PR title` check renames them:

| PR | Title set automatically |
|---|---|
| `dev` → `staging` | `chore(release): promote dev to staging` |
| `staging` → `main` | `chore(release): promote staging to main` |
| `main` → `dev` | `chore: back-merge main into dev` |
| `main` → `staging` | `chore: back-merge main into staging` |

A promotion PR that already has a Conventional Commit title (say, `chore(release): v0.2.0`) keeps it.

No `Co-Authored-By` trailers for AI assistance; if a change was AI-assisted, that's a PR-description
detail, not a commit trailer.

## Where the bigger picture lives

This file documents what exists. The **Platform Blueprint** (shared separately, not checked into this
repo) covers the full architecture this is building toward: bounded contexts, multi-market/currency
model, auth, the reasoning behind decisions like Django over Node or shared-schema multi-tenancy. Read it
before proposing a structural change; it usually already covers the tradeoff.
