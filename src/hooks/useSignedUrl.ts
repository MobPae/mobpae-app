import { useEffect, useState } from "react";

const TOKEN_KEY = "mobpae_employee_token";
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

// Session-level in-memory cache: key → { url, fetchedAt }
const urlCache = new Map<string, { url: string; fetchedAt: number }>();
/** Signed URLs are valid for 15 min; refresh after 10 min to stay ahead of expiry. */
const CACHE_TTL_MS = 10 * 60 * 1000;
// In-flight requests, so simultaneous mounts for the same key (e.g. the header
// avatar and the profile hero avatar) share one fetch instead of firing twice.
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Fetches a short-lived signed URL for a private R2 object key.
 * Returns null while loading or if the key is absent.
 */
export function useSignedUrl(key: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!key) return null;
    const cached = urlCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.url;
    return null;
  });

  useEffect(() => {
    if (!key) {
      setUrl(null);
      return;
    }

    const cached = urlCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setUrl(cached.url);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let cancelled = false;

    let request = inFlight.get(key);
    if (!request) {
      request = fetch(
        `${API_BASE_URL}/files/signed-url?key=${encodeURIComponent(key)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
        .then((r) => {
          if (!r.ok) throw new Error("signed-url request failed");
          return r.json() as Promise<{ url: string }>;
        })
        .then((data) => {
          const signedUrl = data?.url ?? null;
          if (signedUrl) {
            urlCache.set(key, { url: signedUrl, fetchedAt: Date.now() });
          }
          return signedUrl;
        })
        .catch(() => null)
        .finally(() => {
          inFlight.delete(key);
        });
      inFlight.set(key, request);
    }

    request.then((signedUrl) => {
      if (!cancelled) setUrl(signedUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return url;
}
