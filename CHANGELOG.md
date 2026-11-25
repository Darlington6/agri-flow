# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No versioned releases yet —
this is pre-launch, so everything lives under Unreleased until there's a first real deploy.

## [Unreleased]

### Security

- `glob` and `minimatch` are held at their fixed versions (14.0.2+ and 11.0.1+) across the repo. The Expo app's
  build and test tools brought in older copies with moderate advisories, which the CI audit would have stopped.
- Nothing of Google's loads into the app any more, so its security policy no longer allows any Google address
  and its opener policy is back to `same-origin`. Google's ID token comes back in the address's `#fragment`
  (never sent to a server), is removed from the address at once, and is scrubbed from error reports; a random
  `state` ties it to this tab's request and a `nonce` inside the token (checked by the API) stops it being
  replayed.
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

- "Continue with Google" is our own button: the same size and look as the other sign-in buttons, there at
  once, and never filled in with the browser's Google account. Tapping it goes to Google's account picker
  (every time, so people with several Google accounts choose one), and Google sends them back to
  `/auth/google`, which signs them in. Closing the picker goes quietly back to sign-in; anything else says why
  there. The API accepts a `nonce` with the token and checks the token carries it.

- The app downloads each page the first time it's opened instead of everything up front: the first download
  drops from about 313 KB to 126 KB (compressed). Charts (about 100 KB) arrive with the pages that draw them, and
  the phone-number library only with sign-in and the account page. Inside the platform the sidebar stays while
  the next page loads; a spinner appears only if that takes more than half a second. A tab left open across a
  release reloads once to pick up the new files instead of showing an error.

- The app takes on the public site's look: Fraunces headings and IBM Plex Sans text (self-hosted, so the app
  no longer loads Google Fonts and its security policy drops them), pill buttons in the logo's forest green
  with cream text (gold on dark surfaces), and the site's cream background on the entry pages (sign-in, email
  link, confirm email, account, demo roles, not found). Teal stays for links and focus rings. Grey text that
  sits directly on cream is darker (ink-600), and contrast tests cover the new pairings.
- Easier to read: small text is a pixel larger (13 and 15px), and grey text across the app is one step darker
  (no grey text below 4.5:1 any more).
- The demo-role cards keep their icon and title at the top when a neighbour's description is longer.
- The pilot badge is forest green with a green dot, and only the sidebar shows it inside the platform.
- Sign-in opens on email (phone codes need an SMS provider that staging and production don't have yet), and
  switching between email and phone is a clear button instead of small grey text.
- The public demo no longer offers the Platform Admin and Super Admin roles; they still appear locally and on
  preview deployments for development.

- Prettier formats the web app, the site and the shared packages (no semicolons, single quotes, 120
  columns, sorted Tailwind classes), checked in CI. The one-time reformat is its own commit, with no other
  changes.

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

- **Signing in to the Expo app** with an email or a phone number (both send a 6-digit code; the first one
  creates the account) and, in its web version, Continue with Google. The web app's sign-in is unchanged. Once
  signed in, the app opens signed in every time, with or without a connection: the session and the account's
  details are kept in the phone's keychain (iOS) or keystore (Android), and only the API ending the session
  signs someone out, never a dropped connection. The phone field starts on the device's country and has a
  searchable country list. Signed-in accounts see a first home screen (setting up an account in the app comes
  next).
- In the Expo app: the AgriFlow mark, large and faint, behind the welcome, sign-in and home screens; and on
  Android, the app's colour behind the bottom navigation bar as well as the top one (needs a development or
  store build; Expo Go keeps its own grey bar on phones using button navigation).
- Sign-in emails carry a 6-digit code next to the button, for the phone apps, which can't open the link yet.
  Link and code are one sign-in: using either uses up both. The code allows five tries, like phone codes. New
  endpoint `POST /api/v1/auth/magic-link/code/` (`{email, code}`).
- **The Expo app** (`apps/app`, Expo SDK 58 with Expo Router): one codebase for iOS, Android and the web, where
  real features are built from now on. This first step sets up the groundwork every screen will use:
  - the site's look: the same light and dark colour roles as the web app (a test fails if they drift apart),
    Fraunces and IBM Plex Sans shipped inside the app so they work offline, pill buttons in forest (gold in
    dark mode), and screens that scroll on small phones and stay a readable width on tablets and desktops;
  - translations from the start: every string goes through `t()`, keyed by the five launch languages the API
    stores (English, French, Kinyarwanda, Swahili, Twi). A language is offered only once a native speaker has
    reviewed it; until then people see English;
  - a first screen with the logo and a note that signing in is coming next;
  - lint, typecheck, tests (Jest) and a web build in the same root commands CI runs, and `npm run dev` starts it.

  The web app (`apps/web`) stays as the demo until its screens move over.

- A Cooperative demo role: the manager of Techiman Growers' Cooperative, seven growers already on the demo's
  contracts (Abena, the demo farmer, among them). Its dashboard shows members, contracted volume, expected
  harvest and who needs attention; "Members" lists only its farmers, and contracts, harvests, payments and
  alerts are scoped to them.
- "See how signing up works" on the demo page: the real account setup screens, saving and sending nothing,
  ending in the demo as the role chosen.
- A first-visit tour of the demo for each role (who you are, where to start, how to switch role), remembered
  per role on the device and replayable from the Tour button. It's a real dialog: focus stays inside and
  Escape closes it.
- Continue with Google on the sign-in page. New Google users get an account (named from Google) and go
  straight to account setup; someone who already signed up with the same email is signed in to that account,
  which remembers their Google ID from then on. The API checks every Google token itself. In WhatsApp's,
  Facebook's and Instagram's built-in browsers, where Google blocks sign-in, the page explains how to open it in
  a real browser.
- The sign-in page shows just the logo above the card: no product name or pilot badge (the demo link sits below
  the card, and the demo shows its own badge). Screen readers still hear "Sign in to AgriFlow".
- Account setup in the app (`/welcome`): after signing up, people answer one question per screen (name,
  country and language, what they do on AgriFlow and a few details, a phone number they can skip, and the
  terms), and can stop and carry on later on any device. Rwanda's provinces and districts are lists to pick
  from. Afterwards they land on a new home page (`/home`) showing each role's verification and what's coming
  for it during the pilot, with the demo a click away. The account page now edits country, language and each
  role's details, and another role can be added from `/add-role`. Anyone not yet set up, or with new terms to
  agree to, is taken back to `/welcome`. Works on phones, tablets and desktops, light and dark.

- Account setup in the API: people give their name, country and language, choose what they do on AgriFlow
  (farmer, buyer, delivery partner, or the new cooperative role) with a few details about their farm or
  business, optionally add a phone number, and agree to the terms. Each step is saved as they go, so they can
  carry on later on any device. Which terms they agreed to, and when, is recorded, and changing the terms
  version asks everyone again. Staff roles can't be chosen, and every profile starts unverified until staff
  check it in `/admin`. Rwanda's provinces and districts are built in; elsewhere people type their region.

- The sign-in and demo-role pages crossfade through three photos each, with the same slow pan and zoom as the
  site's home page: Gisenyi on Lake Kivu and the Kigali wetlands join the field agents on sign-in; hillside
  rows and Makete (Tanzania) on the demo page. The first photo loads straight away and the rest only after it;
  the crossfade starts once they're all in. People who ask for less motion, or save data, see the first photo,
  still.
- On sign-in, a seedling grows out of the soil when the email link or the text code is on its way (a short
  line drawing, played once; shown already grown for people who ask their device for less motion).

- Photos on the sign-in and demo-role pages: on laptops and desktops the photo fills the left half and stays put;
  on phones and tablets it's a short band across the top, so the form is still on the first screen. They come
  from the site's photo library, now a shared package (`packages/media`) with one licence register for the site
  and the app. The app's copies are sized ahead of time as WebP (about 30 to 50 KB on a phone).
- A country picker on phone numbers (sign-in and "Add phone number"): the flag and dialling code, then the
  local number, so `0788 123 456` with Rwanda picked is sent as `+250788123456`. It starts on a country guessed
  from the device (time zone first, then a region in the language setting, then Rwanda) and is one tap to
  change; typing a number with `+` moves it along. The placeholder is a local example for that country, and the
  code screen shows the number written out (`+250 788 123 456`). Accounts don't record a country yet; when they
  do, adding a number will start on it.

- Light and dark themes for the app: **System** (follows the device), **Light** or **Dark**, chosen in Settings or
  on the account page and remembered in the browser. Colours are named roles (`surface`, `canvas`, `action`,
  `accent`, chart colours) plus the ink scale, which flips in dark mode; dark values live in
  `apps/web/src/index.css`. Dark mode is a neutral charcoal (page `#181a20`, cards and menus a step lighter at `#1e2329`, so they read as raised; grey text at 6.8:1 on cards). Buttons turn gold in dark mode (like the site's dark sections), the logo switches to
  its cream-ringed version, and charts follow the theme. A small script (`public/theme-init.js`) applies the
  saved theme before the page draws, so dark mode never flashes white. Contrast tests check the dark palette.

- Emails redesigned to match the site: a forest-green header with the logo (a PNG hosted on the website at
  `/email/`, since email apps don't show SVG), a gold label, a serif heading, a pill button, the "works once"
  note in a panel, a sign-off ("Thanks for growing with us, The AgriFlow team"), and Website and Privacy links. The
  website's address is `PUBLIC_SITE_URL` (defaults to the current Vercel address).

- Sign-in, sign-up and confirmation emails have an HTML version: the AgriFlow wordmark, a heading, a
  button, and the plain link underneath in case the button doesn't work (the plain-text version stays).
- The account page links home from the logo and, until an account has a role, offers a "What's next" card
  pointing to the demo, so a new account no longer ends at a dead end.
- `/api/v1/debug/sentry-error/` fails on purpose for staff (signed in at `/admin/`) to check that API errors
  reach Sentry; everyone else gets a 404.
- `.git-blame-ignore-revs` lists the Prettier reformat, so blame skips it.
- Mailpit in docker compose: emails the local API sends appear, designed, at http://localhost:8025 (the
  link is still printed in the API's log).

- Error reporting with Sentry (EU region) for the app and the API, switched on by `VITE_SENTRY_DSN` /
  `SENTRY_DSN`. Reports carry the user's id (and roles) only: no names, emails, phone numbers, IP addresses,
  cookies, request bodies or sign-in tokens, with tests that send a real error through the SDK and check what
  would leave. The app's Content Security Policy allows Sentry's EU ingest.

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

- Trying sign-in over and over locally no longer locks you out for an hour: local Docker allows 100 texts or
  emails an hour per caller and 50 emails per address (`SIGN_IN_THROTTLE_RATE`, `EMAILS_PER_ADDRESS_PER_HOUR`).
  Tests, staging and production keep 5 of each.

- The phone step of account setup, and the account page's nudge to add a number, say who will reach you for
  the role you chose (a delivery partner reads "farmers, cooperatives and buyers") instead of always "buyers
  and delivery partners".
- Typing a number with its country code (+233, or 00233) moves the country picker as soon as the code is
  complete, instead of waiting for more of the number. Both apps.
- Grey text in the Expo app is the web app's secondary grey: it was 4.4:1 on cream, under the 4.5:1 minimum,
  and is now 5:1 (lighter in dark mode, 9.9:1). A test checks it. Its "Or" dividers are bold and larger, with clearer lines.

- The Google button no longer flashes a huge Google logo or sits empty while it loads: it's now our own button
  (see Changed), so there's nothing of Google's to wait for.

- Phone numbers are always stored one way (+250788123456), however they're typed. An admin made with
  `createsuperuser` as "+250 793 440 734" used to be a different account from "+250793440734", and could only log
  in with the spaces. The admin login now accepts either, and a migration tidies numbers already saved.

- Local API: it no longer fails to start with "No module named …" after a dependency is added. Its packages
  live in the image (`/opt/venv`) instead of a saved Docker volume that kept old ones; `docker compose up
--build` picks up changes.

- API: no more "Control server error: Permission denied" on every start on Render (gunicorn's optional
  control socket is turned off; nothing used it).

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
