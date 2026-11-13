// JS-side mirror of theme.css, for contexts that need raw values (chart
// colour scales, canvas/SVG generation) rather than CSS utilities.
// apps/web/src/test/tokens.test.ts fails if the two drift apart.

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

export const brand = {
  50: "#f4f8f5",
  100: "#e9eeea",
  200: "#d4ded6",
  300: "#b6c6ba",
  400: "#93a898",
  500: "#728a79",
  600: "#58705e",
  700: "#435949",
  800: "#283f2f",
  900: "#222f26",
  950: "#151d17",
} as const;

export const gold = {
  50: "#faf6ee",
  100: "#f2ecdf",
  200: "#e5dac1",
  300: "#d1bf98",
  400: "#b2934d",
  500: "#9c7f3c",
  600: "#81641b",
  700: "#684e08",
  800: "#4e3a02",
  900: "#382903",
  950: "#221904",
} as const;

export const sage = {
  50: "#f6f8f3",
  100: "#ebeee7",
  200: "#d7ddd1",
  300: "#bcc5b1",
  400: "#93a281",
  500: "#7b896a",
  600: "#616f50",
  700: "#4c573d",
  800: "#38412c",
  900: "#272e1e",
  950: "#181c13",
} as const;

export const ink = {
  50: "#f7f8f7",
  100: "#eef0ee",
  200: "#dde1dd",
  300: "#c1c8c1",
  400: "#9aa59b",
  500: "#78857a",
  600: "#5c6a5f",
  700: "#48544a",
  800: "#33403a",
  900: "#1a221d",
  950: "#101510",
} as const;

/** @deprecated Use `gold`. Kept so existing imports keep working. */
export const accent = {
  base: gold[400],
  ink: brand[950],
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

/** Your own chat message bubbles: the original AgriFlow green, kept by request. */
export const chat = {
  own: "#28583e",
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
