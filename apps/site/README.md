# @agriflow/site

The public AgriFlow website: a static site built with [Astro](https://astro.build), every page pre-rendered to
plain HTML for search engines and fast loading on phones. The platform itself (`apps/web`, later the Expo
app) is separate; this site's job is to explain AgriFlow and collect demo requests.

```bash
pnpm --filter @agriflow/site dev          # http://localhost:4321
pnpm --filter @agriflow/site build        # type check + build to dist/
pnpm --filter @agriflow/site test         # unit tests + checks on the built site (needs a build first)
pnpm --filter @agriflow/site preview      # serve dist/ (starts a background server)
pnpm --filter @agriflow/site exec astro preview stop   # stop it again
```

Astro 7's `preview` runs as a background server: stop it with `astro preview stop` when you're done.

## Structure

```
src/
  i18n/          languages (locales.ts), page paths (paths.ts), all text (dictionaries/en.ts)
  views/         one component per page, used by every language
  pages/         thin routes: English at the root, other languages under pages/[locale]/
  components/    header, footer, hero art, app store placeholders, ...
  lib/           SEO helpers, demo request form logic, country list
  media/         manifest.ts: every photo/video slot on the site
tests/           unit tests and checks on the built HTML in dist/
public/          favicons and og-<language>.jpg (the link-sharing previews)
scripts/         og-images.mjs: renders those previews
```

Colours come from the shared palette in `packages/design-tokens/src/theme.css`, the same file the web app
uses.

## Languages

English is at the root (`/about/`); every other language is under its code (`/fr/about/`, `/sw/about/`, ...).

| Language    | Translation                       | Live                                        |
| ----------- | --------------------------------- | ------------------------------------------- |
| English     | source                            | yes                                         |
| French      | `dictionaries/fr.ts`              | yes (a fluent speaker's skim still welcome) |
| Swahili     | `dictionaries/sw.ts`              | yes (a fluent speaker's skim still welcome) |
| Kinyarwanda | needs a native-speaker translator | no                                          |
| Twi         | needs a native-speaker translator | no                                          |

Machine translation is good for French and Swahili, so those only need a skim. It's weak for Kinyarwanda
and Twi, so those need a native speaker to translate, not just review.

With more than one language live, a compact language picker (globe + language code) appears in the
header; it fits any screen width and keeps you on the same page when you switch.

A language only appears (pages, sitemap, hreflang, language switcher) once it's **published**. To add one:

1. Copy `src/i18n/dictionaries/en.ts` to `<code>.ts`, translate the values (never the keys), and export it
   typed as `Dictionary`. TypeScript and `tests/i18n.test.ts` fail if anything is missing.
2. Register it in `DICTIONARIES` in `src/i18n/index.ts`.
3. Have it reviewed (a skim for French and Swahili; a native speaker's translation for Kinyarwanda and
   Twi). Then set `published: true` in `src/i18n/locales.ts`. The build tests check every published
   language: titles and descriptions fit search results, hreflang, the picker, and no broken links.

## Search engines

| Setting                 | Purpose                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`              | The public origin, e.g. `https://agriflow.com`. Used for canonical URLs, hreflang and the sitemap. Defaults to Vercel's production URL, then `http://localhost:4321`.                                                                                                                                                               |
| `PUBLIC_ALLOW_INDEXING` | Set to `true` to let search engines index the site. **Leave unset until the real domain is live**, so the temporary `*.vercel.app` address doesn't get indexed and later compete with the real one.                                                                                                                                 |
| `PUBLIC_API_URL`        | Base URL of the AgriFlow API, for the demo request form. Until it's set (and the API endpoint exists), the form shows a clear "couldn't send" message.                                                                                                                                                                              |
| `PUBLIC_APP_URL`        | Address of the AgriFlow app (the web app today, the PWA later). Powers "Log in" and "Create account". Unset in a production build, those links are left out; in development they point at the web app on `localhost:5173`. Signing in with a new phone number or email creates the account, so both go to the sign-in page for now. |

Both addresses end up in the public pages, so the build stops if either is set to anything but a plain
`https://` address (no path, no trailing slash, no password). Pages carry a Content Security Policy from
`security.csp` in `astro.config.ts`; add any new outside service there.

Every page has its own title, description, canonical URL, hreflang links, social preview tags and JSON-LD.
`tests/build.test.ts` checks all of that on the built HTML, along with broken links, alt text, one `<h1>`
per page, an axe accessibility scan, and a JavaScript budget of 20 KB per page.

## The home page

The home page is one long scroll with a section for every menu item (how it works, buyers, farmers,
partners, about) plus the app section. The header menu jumps to those sections from any page and in any
language (`/fr/#buyers`), and highlights the section in view. Each section links on to its own page, which
keeps the detail and ranks on its own in search.

The phone menu and the language picker are plain `<details>` popovers, so they work without JavaScript.
With it (`src/lib/popovers.ts`), they also close on a click outside, on Escape, and after a menu link is chosen.

The glowing logo (`LogoGlow.astro`, the sun from the original hero artwork) and the field stripes
(`FieldRows.astro`) decorate the dark sections. Filled buttons use the logo's colours rather than the app's teal: forest `brand-800` (the outer circle, cream text) on light backgrounds, gold `gold-400` (the centre, dark text, 5.9:1) on dark ones. In the closing call to action, the button sits in the
centre of the gold sun on laptops and desktops.

## Photos

Every photo slot is listed in `src/media/manifest.ts`. Files live in `src/assets/media/`, and Astro turns
them into AVIF/WebP at several widths at build time (never wider than the original). A slot whose file is
missing shows drawn artwork instead, so the site always builds.

- The hero photos (four, at least three) crossfade with a slow pan and zoom, which feels like video without a
  video download. It stands still for visitors who turn off motion.
- The pages behind "Learn more" (how it works, buyers, farmers, partners, about) and request a demo open on
  a photo header (`PageHero` with `photo`); the form sits below it. Privacy and terms stay plain.
- Background photos are decorative (empty alt text); section photos are described, in every language
  (`media` in the dictionaries).
- **Only licensed photos go in `src/assets/media/`.** This repository is public, so committing a photo
  republishes it. `tests/app.test.ts` fails if a photo there has no `source` and `licence` in the manifest,
  or isn't used. Raw downloads and photos we can't use yet go in `apps/site/assets/`, which is git-ignored.
- AI-generated images (the partners photos, for now) record the tool as their source. They're placeholders
  until we have our own photos from the pilot.
- Full-width backgrounds want images at least 1920px wide; smaller ones are softened by the dark wash.
  Background photos (`<Photo background>`: the hero, page headers, climate) are served at quality 50 and at
  most 1600px wide, since the dark wash hides fine detail: about a third of the download of a section photo.
- Every photo records its `source` (the photo's page) and `licence` in the manifest: our proof that we may
  use it, and how to find the original again. It isn't shown on the site; Unsplash and Pexels need no credit.
- `public/og-<language>.jpg` (`og-en.jpg`, `og-fr.jpg`, `og-sw.jpg`) is the preview shown when a page is shared
  (WhatsApp, LinkedIn, X...), in that page's language: 1200×630, under 300 KB so WhatsApp shows it. It's
  rendered from the hero photo, the glowing logo, the field stripes and the hero headline. Re-render after
  changing the headline, the hero photo or a published language, then commit the images:
  `pnpm --filter @agriflow/site build && pnpm --filter @agriflow/site og` (uses your installed Chrome; set
  `CHROME_PATH` if it isn't found). The build tests fail if a published language has no preview.
- The page headers settle with one slow zoom as the page opens, then stay still (no motion with reduced
  motion turned on).

## App store badges

`AppStoreBadges.astro` shows neutral "Coming soon" placeholders. They deliberately don't use Apple's or
Google's badges or logos, which may only be used once an app is listed. Replace them with the official
badges and store links at launch.

## Deploying (Vercel)

The site deploys as its **own Vercel project**, separate from the web app and API, so it can take the main
domain later while the app moves to `app.<domain>`:

1. Vercel → Add New → Project → import this repository.
2. Root Directory: `apps/site`. Framework preset: Astro (detected). Build Command: `pnpm build`. Output
   Directory: `dist`. Leave the Install Command as it is: Vercel sees the pnpm lockfile at the repo root and
   installs the whole workspace, which the site needs for `@agriflow/design-tokens`.
3. Environment variables: `PUBLIC_APP_URL`, the app's address only (e.g. `https://agri-flow-eight.vercel.app`;
   the site adds `/signin`). Leave `PUBLIC_API_URL` unset until the demo request endpoint exists and the API's
   `CORS_ALLOWED_ORIGINS` includes the site's address. Leave `PUBLIC_ALLOW_INDEXING` unset.
4. Deploy. When the domain is ready: add it to this project, set `SITE_URL` to it and
   `PUBLIC_ALLOW_INDEXING=true`, then redeploy.
