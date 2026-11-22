# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No versioned releases yet —
this is pre-launch, so everything lives under Unreleased until there's a first real deploy.

## [Unreleased]

### Security

- Builds stop when `VITE_API_URL`, `PUBLIC_API_URL` or `PUBLIC_APP_URL` isn't a plain `https://` address,
  without printing the value; Vercel builds of the app also need `VITE_API_URL`. These values are public, and
  a database connection string had been pasted into one.
- Security headers on the app and the site: a Content Security Policy (only the apps' own files, Google
  Fonts, the API and Vercel's preview toolbar), no framing, `nosniff`, a strict referrer policy, and no
  camera, microphone or location access.
- A dependency audit in CI (`pnpm audit`, `pip-audit`) on every PR and weekly.
- PyJWT 2.13.0 → 2.15.1 (15 published advisories in the library that signs sign-in tokens) and Astro
  7.4.4 → 7.4.7.

### Changed

- API: phone numbers are optional (an account needs a phone number or an email); emails are stored in lower
  case. Email links are limited to 5 an hour per caller, and one address gets at most 5 emails an hour.
  Sign-in responses say whether the account was just created (`created`).

- API staging and production settings (`config/settings/deployed.py`) no longer fall back to a public secret
  key, a SQLite database, every host, or every origin: the server refuses to start if a value is missing. Only
  the app and the site may call the API from a browser. A local `.env` is only read with the dev settings.

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

- Sign up with a phone number or an email. Signing in by email no longer needs an existing account: an
  unknown email gets a "finish creating your account" link, and the account is created when it's used (so
  a mistyped address never creates one). The answer is the same either way.
- Add the other one later from the account page: an email (confirmed by a link, which works on any device)
  or a phone number (confirmed by a texted code). A number or email another account uses is refused.
- Logging out also retires the refresh token on the API (`POST /api/v1/auth/token/logout/`).

- API hosting on Render (`render.yaml`): production from `main` and staging from `staging`, both built from
  `apps/api/Dockerfile` in Frankfurt on the free plan, with Neon Postgres. Each start runs `migrate`, then
  gunicorn (`apps/api/scripts/serve.sh`); the admin's CSS and JS are served by WhiteNoise. The app finds the
  API through `VITE_API_URL`. Setup steps: Deployments in CONTRIBUTING.
- API: magic links are emailed through Brevo (django-anymail) in staging and production. A failed send is
  logged; the answer stays the same, so it never reveals whether an email has an account. Phone sign-in
  answers "not available yet" (503) there until an SMS provider is set up.

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

- App: people were signed out about an hour after signing in. Each refresh hands out a new refresh token and
  retires the old one, but the app kept the old one, so the second refresh failed. It now keeps the new one,
  and requests that expire together share one refresh instead of spending the same token twice.

- Reloading any page of the deployed app other than the home page (a refresh, or coming back to a tab the
  browser had unloaded) showed Vercel's 404. `apps/web/vercel.json` now answers every address with the app, which
  shows the right screen or its own "page not found". This also fixes the site's "Log in" link.
- Site: on laptops around 1024px wide, the Swahili menu items and "Omba onyesho" wrapped onto two lines.
  Header words no longer wrap, and menus too long to fit (Swahili) use the Menu button until 1280px.
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

- The repo-root `vercel.json` (the API as a second Vercel service): the API is hosted on Render instead, which
  can later run Celery workers and long-lived connections. The app's own `apps/web/vercel.json` stays.
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
