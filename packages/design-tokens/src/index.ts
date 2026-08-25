// JS-side mirror of tokens.css, for contexts that need raw values
// (chart color scales, canvas/SVG generation) rather than CSS custom
// properties. Keep these two files in sync by hand for now; a follow-up
// can generate one from the other (e.g. via Style Dictionary) once this
// package has more than a handful of tokens.

export const primary = {
  50: "#e9f4f6",
  100: "#cee7eb",
  200: "#a0d0d8",
  300: "#6bb3bf",
  400: "#3b93a3",
  500: "#1d7688",
  600: "#0e5d71",
  700: "#0a4a5c",
  800: "#083b49",
  900: "#062e39",
  950: "#041d24",
} as const;

export const accent = {
  base: "#f0af1a",
  ink: "#231603",
} as const;

export const status = {
  good: "#2f8f5b",
  goodBg: "#eaf6ef",
  warn: "#b8791f",
  warnBg: "#fdf3e3",
  risk: "#c14639",
  riskBg: "#fbeae8",
  info: "#2b6ea8",
  infoBg: "#eaf3fb",
} as const;

export const fonts = {
  app: {
    display: '"Manrope", "Segoe UI", system-ui, sans-serif',
    body: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  },
  site: {
    display: 'Fraunces, Georgia, "Times New Roman", serif',
    body: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
  },
} as const;

export type ThemeMode = "system" | "light" | "dark";
