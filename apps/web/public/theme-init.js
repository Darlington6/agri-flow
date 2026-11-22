// Applies the saved light/dark theme before the page draws, so a dark page
// never flashes white. A file rather than an inline <script>, because the
// Content Security Policy only runs the app's own files. Mirrors
// src/lib/theme.ts (same storage key and rules); keep the two in step.
;(function () {
  var mode = 'system'
  try {
    var saved = localStorage.getItem('agriflow.theme')
    if (saved === 'light' || saved === 'dark') mode = saved
  } catch {
    // Blocked storage (private mode): follow the device setting.
  }
  var dark =
    mode === 'dark' || (mode === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
