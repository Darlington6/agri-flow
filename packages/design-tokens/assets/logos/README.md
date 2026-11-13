# AgriFlow logos

The single source for the AgriFlow mark. The website, the PWA and the mobile apps all take their logo from
here, never from a copy.

## The mark

Three circles: a forest ring, a gold sun or seed inside it, and a sage circle overlapping at the lower left.

| Colour | Hex | Role |
|---|---|---|
| Forest | `#283F2F` | outer ring |
| Gold | `#B2934D` | inner disc |
| Sage | `#93A281` | overlapping disc |
| Cream | `#F5F1E6` | ring on dark backgrounds; app-icon background |

The SVGs are exact geometric rebuilds of the original artwork in `source/`. The difference from
`source/agriflow-mark-original.png` is under 0.5% of pixels, all of it edge anti-aliasing.

## Files

| File | Use |
|---|---|
| `agriflow-mark.svg` | **Master.** Default mark on light backgrounds. |
| `agriflow-mark-reversed.svg` | On dark backgrounds (the forest ring becomes cream). |
| `agriflow-mark-1024.png` | Raster mark, transparent, 1024 px wide, for places that can't take SVG. |
| `agriflow-app-icon.svg` / `agriflow-app-icon-1024.png` | Square app icon (mark on cream). Source for PWA, iOS and Android icons. |
| `source/` | Original artwork as supplied. Reference only; don't use these in apps. |

Web favicons generated from these live in `apps/web/public/`. `favicon.svg` switches to the cream ring
when the browser is in dark mode.

## Using it

In `apps/web`, use the component, not a file path:

```tsx
import { LogoMark } from '@/components/brand/LogoMark'

<LogoMark className="h-9" />                     // sized by height
<LogoMark className="h-9" variant="reversed" />  // on dark backgrounds
```

Other apps import the files through the package: `@agriflow/design-tokens/assets/logos/agriflow-mark.svg`.

## Rules

- Keep clear space around the mark of at least the sage circle's radius (about a quarter of the mark's
  width).
- Don't recolour, stretch, rotate or add effects. For dark backgrounds use the reversed file.
- There's no wordmark artwork yet. Next to the mark, the name "AgriFlow" is set in the app's display font.
