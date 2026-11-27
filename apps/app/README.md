# AgriFlow app (`apps/app`)

One Expo app for iOS, Android and the web, on the same API and accounts as everything else. Real features are
built here; the older web app (`apps/web`) stays as the demo until its screens move over.

## Running it

From the repo root, `npm run dev` starts this app alongside the site and the web app. Metro runs on
http://localhost:8081. In its terminal:

- press `w` to open the web version in your browser;
- scan the QR code with **Expo Go** (iOS/Android) to open it on your phone, which must be on the same network.

To run only this app: `pnpm --filter @agriflow/app dev`.

**Signing in needs the API** (`docker compose up -d postgres redis mailpit api`, see the root README). In
development the app finds it on port 8000 of the computer running Expo, so a phone on the same Wi-Fi reaches it
too. Codes show in a "Dev mode" box on screen, in Metro's terminal and in Mailpit (http://localhost:8025). For
staging and production builds, set `EXPO_PUBLIC_API_URL`.

## Checks

The root commands that CI runs cover this app too:

| Command                              | What it does here                                                  |
| ------------------------------------ | ------------------------------------------------------------------ |
| `pnpm run lint`                      | oxlint                                                             |
| `pnpm run build`                     | `tsc --noEmit` (tests included), then `expo export --platform web` |
| `pnpm run test`                      | Jest with `jest-expo` and React Native Testing Library             |
| `pnpm run format:check`              | Prettier                                                           |
| `pnpm --filter @agriflow/app doctor` | `expo-doctor`: checks package versions match the Expo SDK          |

Add packages with `npx expo install <package>` (from `apps/app`), not `pnpm add`, so versions match the SDK.

## How it's put together

```
src/
  app/          routes only (Expo Router): every file here is a screen address
  screens/      what each route shows; a route file just renders its screen
  components/   shared building blocks: Text, Button, TextField, PhoneField, ChoiceField, ChipGroup,
                Checkbox, Sheet, Message, Screen, LogoMark, LogoGlow
  auth/         the API's endpoints, the saved session and useAuth()
  onboarding/   setting up an account: its types and rules (which steps, which roles)
  lib/          plain helpers: the API address, phone numbers, Google, secure storage
  theme/        colour roles (light/dark), typefaces, sizes and spacing
  i18n/         languages, dictionaries and t()
  test/         test helpers (a fake API and storage) and the route tests
```

**Signing in.** Email first, phone one tap away; both send a 6-digit code (the email also has a link, for the
web app). Continue with Google shows in the web version only, using the same redirect as the web app
(`src/lib/google.ts`); iOS and Android need Google's on-device sign-in and an OAuth client each, which come
later. The layout (`src/app/_layout.tsx`) shows the start and sign-in screens to people signed out, the welcome
steps to accounts not set up yet (or with new terms to agree to), and home after that, and moves between them by
itself.

**Setting up an account.** The same steps as the web app's, one per screen: who they are (full name and date of
birth as on their ID, and optionally gender, all kept private for verification later, plus the shorter name
other people see; someone under 18 also gives a parent or guardian's name, relationship and phone number),
country and language, a role and its details, a phone number (skippable; not asked of
phone sign-ups) and the terms. Each step saves as it's answered, so someone can stop and carry on later on any
device; the API says where they got to. Staff skip the role step; someone already set up only sees new terms.
Back (top left, and Android's back button) steps back through it. It needs a connection, and says so when
there isn't one.

**Offline.** The session (the API's two tokens) and the account's details are saved in secure storage: the
keychain on iOS, the keystore on Android, `localStorage` on the web. The app opens signed in from them straight
away, then checks with the API in the background, and again whenever the app comes back to the front. No
connection is never a reason to sign someone out; only the API refusing the session is (`src/auth/api.ts`).

**Look.** Screens use colour roles (`canvas`, `surface`, `text`, `muted`, `action`, …) from `src/theme`, never
raw colours. The roles match the web app's (`src/theme/colors.test.ts` compares them). Fonts are the site's
Fraunces and IBM Plex Sans, bundled with the app so they work offline; on native each weight is its own font
family, so use the `Text` variants rather than `fontWeight`.

**Every device.** `Screen` scrolls when content doesn't fit (small phones, large text) and keeps content to a
readable width on tablets and desktop browsers. Buttons are at least 48 px tall.

**Languages.** Every string on screen goes through `t('key')` from `useI18n()`; English in
`src/i18n/dictionaries/en.ts` is the source. The codes match what the API stores on an account (`en`, `fr`, `rw`,
`sw`, `tw`). To add a language, translate `en.ts` into a new dictionary, have a native speaker review it, then set
it in `src/i18n/languages.ts`. Until then, people who use that language see English: machine translation isn't
good enough, especially for Kinyarwanda and Twi.

**Logo.** Taken from `packages/design-tokens/assets/logos`, never copied. The app icon and splash screen use
the same files.

## Not set up yet

- Store builds (EAS): needs the app's bundle identifier and an Expo account. Until then, use Expo Go.
- Android's adaptive icon reuses the square app icon; it needs artwork with the mark inside Android's safe zone.
- Hosting the web version.
- Continue with Google on iOS and Android (needs the bundle identifier and an OAuth client for each).
