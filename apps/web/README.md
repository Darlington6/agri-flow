# @agriflow/web

The AgriFlow platform frontend — see the [root README](../../README.md) for what this app actually is
(the prototype, its features, its limitations). This file is just how to run it.

```bash
pnpm --filter @agriflow/web dev            # dev server, http://localhost:5173
pnpm --filter @agriflow/web run build      # typecheck + production build
pnpm --filter @agriflow/web run lint
pnpm --filter @agriflow/web run typecheck
```

Or from the repo root, via Turborepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

Use **Node 24** (`.nvmrc` at the repo root): `nvm use` or `fnm use`. Vitest doesn't start on Node 26 yet.

## Tests

[Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
and jsdom. Tests sit next to the code they test, named `*.test.ts` / `*.test.tsx`.

```bash
pnpm --filter @agriflow/web test             # run once (what CI runs)
pnpm --filter @agriflow/web test:watch       # re-run on save
pnpm --filter @agriflow/web coverage         # coverage report in apps/web/coverage/
```

- Test behaviour the user sees: query by role and accessible name (`getByRole('button', { name: … })`),
  not by CSS class or test IDs.
- Anything involving dates must hold in every time zone the product serves. `src/lib/date.test.ts`
  runs its cases in UTC, West Africa, Rwanda and East Africa; follow that pattern.

## Dates and times

Two different things, handled differently:

- **Calendar dates** (a harvest date, a delivery day) are the same day for everyone. Keep them as
  `'YYYY-MM-DD'` strings and do arithmetic with `src/lib/date.ts`, which calculates in UTC so the device's
  time zone can't shift the day.
- **Moments** (a message sent, a payment made) are stored as full ISO timestamps in UTC (`…Z`), which is
  what the API stores, and shown in the viewer's own time zone with `Intl.DateTimeFormat`. 13:40 UTC
  shows as 13:40 in Accra, 15:40 in Kigali and 16:40 in Nairobi; 23:40 UTC on Friday shows as 01:40
  Saturday in Kigali.

## Colours

The palette lives in `packages/design-tokens/src/theme.css` (imported by `src/index.css`); never define
colours in this app. Pick colours by role, not by look:

| Role             | Use                                | Examples                                                                 |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `primary` (teal) | Anything you can tap               | Buttons, links, selected nav/filters, focus rings                        |
| `brand` (forest) | Identity                           | Icon chips, avatars, headings, dark cards, chart series                  |
| `gold`           | Warm highlight, sparingly          | The pilot tag                                                            |
| `sage`           | Soft surfaces                      | Progress tracks, soft panels                                             |
| `ink`            | Text, borders, backgrounds         | Body text, dividers                                                      |
| `chat-own`       | Your own chat bubbles              | Contract chat, AI Copilot (the original AgriFlow green, kept on purpose) |
| `status-*`       | Meaning: good, warning, risk, info | Dots, icons, timeline ticks: keep these conventional                     |
| `status-*-text`  | Text on a `status-*-bg` badge      | Same hues, darkened to 4.5:1 for small text (`Badge` uses these)         |

The logo's gold and sage are too light for text on white; use them as fills and their `700`+ shades for
text. Pick-one-of-these choices (like the demo roles) use `CardButton`, a real button, never a clickable `<div>`.
`src/test/tokens.test.ts` fails if a palette change drops a key pairing below WCAG AA contrast.

## Pages load on demand

Every page in `src/App.tsx` is loaded with `page()` (`src/lib/lazyPage.ts`), so it's its own download, fetched
the first time it's opened. Add new pages the same way. Import heavy, single-purpose components straight from
their file rather than the `@/components/ui` index (as the sign-in pages do with `PhoneInput`), so their
libraries don't ride along with every page.

## Phone numbers

Type phone numbers with `PhoneInput` and `usePhoneField` (`src/components/ui/`, imported from their own files), never a bare `<input type="tel">`.
It pairs a country picker (flag and dialling code, a native `<select>`, so phones show their own list) with the
local number, and gives the page the number in international form (E.164) to send. `src/lib/phone.ts` does the
work with `libphonenumber-js`: it guesses the starting country (the account's, then the device's time zone, then
a region in its language setting, then Rwanda), reads a local number with its leading 0, and writes numbers out
for people (`formatPhone`). The API checks every number again.

## Real accounts: setup, home and account

After signing in, a real account goes to `/welcome` until it's set up, then to `/home` (`landingFor` in
`src/lib/onboarding.ts`). `RequireAccount` guards `/home`, `/account` and `/add-role` the same way, so an
account that isn't set up, or has new terms to agree to, always lands back on `/welcome`.

- **`/welcome`** asks one question per screen: name, country and language, role and its details, a phone
  number (skippable; not asked if they signed up with one) and the terms. Each step saves to the API as it
  goes and the page starts at the API's `next_step`, so people can stop and carry on on any device. Staff skip
  the role step; an account already set up sees only the new terms.
- **The flow (`OnboardingFlow`) doesn't call the API itself**: it takes a driver with the starting point and
  one function per save. `WelcomePage` passes the API driver; the demo's walkthrough can pass one that saves
  nothing, so both show the same screens.
- **`RoleDetailsForm`** is the per-role form, used in setup and to edit details on `/account`. Pick lists
  (Rwanda's provinces and districts, crops, buyer types, vehicles) come from the API's `network/options/`;
  countries without a place list get text fields. Field errors from the API show next to their field.
- **`/home`** shows each role's verification and what's coming for it during the pilot, with the demo a click
  away. Real accounts never show sample data.
- The terms and privacy links point at the public site, `VITE_SITE_URL` (default: the production site).

## Demo extras

- **Roles** live in `src/lib/permissions.ts` (what each can reach), `src/lib/scope.ts` (which records) and
  `src/components/layout/navigation.ts` (labels). A new role touches all three, plus `SessionContext` and the
  dashboard; TypeScript flags most places (`Record<DemoRole, …>`), but not `role === '…'` checks, so search for
  those too.
- **The tour** (`DemoTour`, text in `src/lib/demoTour.ts`) is a native `<dialog>`. Its "where to start" list
  comes from the role's own navigation, so labels stay in step.
- **The sign-up walkthrough** (`/try-sign-up`) is `OnboardingFlow` with a driver that saves nothing. Its pick
  lists are a copy in `src/data/setupOptions.ts`; an API test fails if that copy and the API's lists differ.

## Continue with Google

`GoogleButton` (`src/components/auth/`) draws Google's own button (Google Identity Services), loading Google's
script only on the sign-in page. Its ID token goes to the API's `auth/google/`, which checks it. The client ID is
public and built in (`VITE_GOOGLE_CLIENT_ID` overrides it). Google only allows the addresses listed on that client
(local, staging and production), so the button doesn't work on per-PR preview links. Inside apps' built-in
browsers (WhatsApp, Facebook, Instagram), where Google refuses to sign in, it explains how to open the page in a
real browser instead. `vercel.json` allows Google's sign-in addresses in the security policy, and the
opener policy is `same-origin-allow-popups` so Google's popup can report back. Google first draws a stand-in
of its button that stays unstyled until Google's styles arrive (some of which the policy blocks), so it would
show a huge logo: `GoogleButton` hides it and shows a plain pill until Google's frame has loaded. Don't clip the
button's area: Google's frame reaches 10px past each side for its focus ring.

## Photos

The entry pages (sign-in, demo roles) use `AuthLayout`: photos beside the content (a band on top on phones and
tablets) that crossfade with a slow zoom, as on the site's home page; a still first photo for less motion or
data saving. Photos come from `packages/media`, shared with the site and its licence register. The app has no image
pipeline, so the photos it uses (`APP_PHOTOS` there) are sized ahead of time into `packages/media/app/`; after
changing them, run `pnpm --filter @agriflow/media app-images`. `src/lib/appPhotos.test.ts` fails if a copy is
missing or left over.

## Places

Locations are structured (`Place`: name, administrative area, ISO country code), never free text, so
matching works across countries: regions in Ghana, provinces in Rwanda, counties in Kenya. Compare and
format them with `src/lib/places.ts`; never match place names by substring.

- Test files are type-checked by `tsconfig.test.json` (Node types available); app code by
  `tsconfig.app.json` (no Node types, so app code can't depend on Node by accident).

The platform screens run from `src/data/` mock fixtures and need no backend. Real sign-up and sign-in (`/signin`, `/account`,
`/magic-link`, `/confirm-email`) calls the API at `VITE_API_URL` (see `.env.example`; defaults to `http://localhost:8000` in
dev). Start it with `docker compose up -d postgres redis api` from the repo root.

`VITE_API_URL` is built into the public JavaScript, so a build stops if it's anything but a plain `https://`
address (and a Vercel build stops without it). The Content Security Policy in `vercel.json` only allows the
API on `*.onrender.com`: if the API moves to its own domain, add it to `connect-src` there.

With `VITE_SENTRY_DSN` set (Vercel only; leave it unset locally), errors go to Sentry tagged with the
deployment (`production` or `preview`), the commit, and the user's id and roles. Emails, phone numbers and
the tokens in sign-in links are scrubbed first (`src/lib/monitoring.ts`).

## Building for every device

Every screen has to work on phones, tablets and desktops. Build mobile-first (base styles for small
screens, then `sm:`/`md:`/`lg:` upwards), keep touch targets at least 44px, and check new UI at phone width
(~375px) as well as desktop before opening a PR.
