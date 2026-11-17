# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No versioned releases yet —
this is pre-launch, so everything lives under Unreleased until there's a first real deploy.

## [Unreleased]

### Changed

- Palette (option A): teal `primary` for everything you can tap; the logo's forest, gold and sage for
  identity, the pilot tag and soft surfaces. Status colours (KYC, risk, timeline) unchanged. The palette now
  lives in one shared file, `packages/design-tokens/src/theme.css`, which `apps/web` imports.
- Delivery matching works in any country and is no longer a text-matching placeholder: jobs and
  partners use structured places (area + ISO country code) and service areas, matched exactly. Scoring
  (out of 100) weighs pickup coverage, drop-off coverage, trips needed from vehicle capacity, cold chain
  for perishable crops, and rating. Partners covering neither end of a trip are no longer recommended.
- Node 24 LTS for the web app (CI via `.nvmrc`, the web Dockerfile, `engines` for Vercel). Node 20 reached
  end of life in April 2026, and Vitest needs 22+.
- `dev` is squash-only (one Conventional Commit per PR); promotions to `staging`/`main` stay merge
  commits. Pre-filled promotion PR links and a promotion PR template.
- Docs: README brought up to date (real sign-in, the API, uv, how to run web + API locally, where the
  product is heading); CONTRIBUTING gains a definition of done (works on every device size, tests
  written, docs updated) and a warning against "Update branch" on promotion PRs.
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

- `apps/site`: the public website, built with Astro. Nine pages (Home, How it works, For buyers, For farmers,
  For partners, About, Request a demo, Privacy and Terms drafts) pre-rendered as HTML, with per-page titles,
  descriptions, canonical URLs, hreflang, social previews, JSON-LD and a sitemap. Built for English, French,
  Kinyarwanda, Swahili and Twi: English, French and Swahili live; Kinyarwanda and Twi await native-speaker
  translation.
  Search indexing stays off until the real domain is live. The home page is one long scroll with a section for
  each menu item (the menu jumps to them and highlights the one in view), photo sections with a crossfading
  hero, photo headers on the detail pages, "Log in" / "Create account" links into the app (`PUBLIC_APP_URL`), and the
  glowing logo with field stripes as a backdrop. Link-sharing preview images in each language (`og-en.jpg`, `og-fr.jpg`, `og-sw.jpg`, rendered by `pnpm og`) with the same look. Buttons take the logo's colours: forest (its outer circle) for the header's "Request a demo" and the form, gold (its centre) on the dark photo sections. Licensed photos (Unsplash, Pexels, AI-generated placeholders for people we don't have photos of yet), each with its source recorded and checked by a test. The phone menu and language picker close on a click outside. "Coming soon" App Store / Google Play
  placeholders, drawn hero artwork until licensed media arrives, and a demo request form ready for the API
  endpoint. Tests check the built HTML: metadata, links, alt text, headings, an axe accessibility scan and a
  20 KB JavaScript budget per page.
- Palette tests: `theme.css` and the JS mirror stay identical, the logo colours stay in the scales, and key
  text/background pairings must meet WCAG AA contrast.
- `apps/web` tests: Vitest + Testing Library + jsdom, run in CI. First suites cover role permissions,
  delivery scoring, date and number formatting, and the `LogoMark` component.
- AgriFlow logo: SVG mark (standard + reversed), square app icon and the original artwork in
  `packages/design-tokens/assets/logos/`; `LogoMark` component in `apps/web` replaces the placeholder leaf
  icon in the sidebar, landing header, demo login and sign-in pages; new favicon (SVG with dark-mode
  variant, ICO fallback) and Apple touch icon.
- `pr-policy.yml`: CI checks that PRs follow the promotion flow (`main` only from `staging`/`hotfix/*`,
  `staging` only from `dev`/`main`/`hotfix/*`) and that PR titles are Conventional Commits.
- `ruff format --check` in CI.

### Fixed

- Reloading any page of the deployed app other than the home page (a refresh, or coming back to a tab the
  browser had unloaded) showed Vercel's 404. `apps/web/vercel.json` now answers every address with the app, which
  shows the right screen or its own "page not found". This also fixes the site's "Log in" link.
- Status badges (KYC, risk) and small grey text were below the 4.5:1 contrast standard for small text;
  they now use slightly darker shades of the same colours. Badges no longer wrap onto two lines.
- The demo login's role cards couldn't be used with a keyboard or screen reader; they're now real buttons
  (a reusable `CardButton`).
- Focus rings on buttons were too faint to see (as low as 1.3:1 against white); all buttons now use a ring
  that meets the 3:1 minimum for non-text contrast.
- Delivery matching: a partner covering "Bono" matched "Bono East" jobs, and one covering "Greater
  Accra" didn't match jobs to "Accra". Loads far above a vehicle's capacity counted as a fit.
- `addDays` / `daysBetween` returned a date one day early in time zones east of UTC (e.g. Kigali,
  Nairobi), shifting harvest and planting dates by up to two days. They now calculate in UTC.

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
