// ─── App-wide constants ───────────────────────────────────────────────────────
// Single source of truth for values that appear in multiple screens.
// Update here; all screens pick up the change automatically.

export const SUPPORT_EMAIL = "support@mobpae.com";

// Version is read from package.json via Vite's define (see vite.config.ts).
// Falls back to the string if the env var is not set (e.g. local dev without build step).
export const APP_VERSION: string =
  (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null) ?? "2.4.0";
