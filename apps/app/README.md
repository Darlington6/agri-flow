# AgriFlow app (`apps/app`)

One Expo app for iOS, Android and the web, on the same API and accounts as everything else. Real features are
built here; the older web app (`apps/web`) stays as the demo until its screens move over.

## Running it

From the repo root, `npm run dev` starts this app alongside the site and the web app. Metro runs on
http://localhost:8081. In its terminal:

- press `w` to open the web version in your browser;
- scan the QR code with **Expo Go** (iOS/Android) to open it on your phone, which must be on the same network.

To run only this app: `pnpm --filter @agriflow/app dev`.

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
  components/   shared building blocks: Text, Button, Screen, LogoMark
  theme/        colour roles (light/dark), typefaces, sizes and spacing
  i18n/         languages, dictionaries and t()
```

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
