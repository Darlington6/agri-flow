# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No versioned releases yet —
this is pre-launch, so everything lives under Unreleased until there's a first real deploy.

## [Unreleased]

### Changed

- `apps/api` moved from Poetry to **uv**. `uv.lock` (exact same versions as the old `poetry.lock`) is now
  the single lock that CI, the Dockerfile and Vercel install from. `poetry.lock`, `poetry.toml` and the
  generated `requirements.txt` are gone, and so is the manual regenerate step on Dependabot PRs.
  Dependabot uses its `uv` ecosystem.
- `apps/api` moved to standard PEP 621 `pyproject.toml` metadata; Poetry 2.4.1 pinned in CI and the
  Dockerfile; Python pinned via `apps/api/.python-version`.
- `apps/api/requirements.txt` (what Vercel installs) is now generated from `poetry.lock` and CI fails if
  it drifts. It previously omitted `celery`/`redis`, which Django imports at startup.
- Dependabot: minor/patch updates grouped per ecosystem, Conventional Commit titles, Django majors held
  until a deliberate upgrade.
- CONTRIBUTING documents the full branch/merge/back-merge policy, Vercel deployments and dependency
  handling.

### Added

- `pr-policy.yml`: CI checks that PRs follow the promotion flow (`main` only from `staging`/`hotfix/*`,
  `staging` only from `dev`/`main`/`hotfix/*`) and that PR titles are Conventional Commits.
- `ruff format --check` in CI.

### Removed

- `deploy.yml`, a manual-only placeholder that always failed. Deployment is Vercel's Git integration.

- Monorepo scaffold: `apps/web` (the prototype, moved unchanged), `apps/api` (Django + DRF skeleton,
  Dockerized, one health endpoint), `packages/types` / `packages/design-tokens` / `packages/ui` /
  `packages/config` workspace stubs.
- `docker compose up` for a full local stack (Postgres, Redis, api, web).
- CI (GitHub Actions): lint/typecheck/build for `apps/web`, lint/check/test for `apps/api`, on every PR
  into `dev`/`staging`/`main`.
- Repo hygiene: PR template, issue templates, CODEOWNERS, Dependabot, SECURITY.md, CONTRIBUTING.md.
- AgriFlow prototype itself: demand → contract matching, KYC, marketplace, delivery coordination with
  partner self-booking, in-contract chat, Executive revenue view — six demo roles (Platform Admin, Super
  Admin, Buyer, Farmer, Field Agent, Delivery Partner). See the README for the full feature list.
