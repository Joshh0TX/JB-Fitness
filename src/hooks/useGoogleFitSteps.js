/**
 * useGoogleFitSteps
 *
 * Reads today's step count from the Google Fit REST API. Because Android's
 * hardware pedometer is always running (even screen-off), Google Fit
 * continuously accumulates steps in the background — this hook surfaces
 * that 24/7 count whenever the app is open.
 *
 * Requirements:
 *   - VITE_GOOGLE_CLIENT_ID must be set in your frontend .env file.
 *   - The Google Cloud project must have the "Fitness API" enabled and the
 *     OAuth Client ID must be of type "Web application" with your domain
 *     listed as an authorised JavaScript origin.
 *
 * Flow:
 *   1. Loads the Google Identity Services (GIS) library.
 *   2. On first visit: shows a "Connect Google Fit" button.
 *   3. After the user grants access, caches the token in localStorage.
 *   4. On subsequent visits, automatically syncs steps silently.
 *   5. Token expires in 1 hour — the hook auto-reconnects silently when
 *      possible, otherwise prompts the user to reconnect.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const FITNESS_SCOPE = "https://www.googleapis.com/auth/fitness.activity.read";
const TOKEN_KEY     = "gfit_token";
const STEPS_KEY     = "gfit_steps_today";
const DATE_KEY      = "gfit_steps_date";
const SCRIPT_ID     = "gsi-script";

// ─── Small helpers ────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayMidnightMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function loadStoredToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.expires_at) return null;
    if (Date.now() >= parsed.expires_at) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToken(tokenResponse) {
  const expires_at =
    Date.now() + (Number(tokenResponse.expires_in) || 3600) * 1000 - 30_000;
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ access_token: tokenResponse.access_token, expires_at })
  );
}

function loadCachedSteps() {
  try {
    if (localStorage.getItem(DATE_KEY) !== todayISO()) return 0;
    return Number(localStorage.getItem(STEPS_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function saveCachedSteps(steps) {
  try {
    localStorage.setItem(STEPS_KEY, String(steps));
    localStorage.setItem(DATE_KEY, todayISO());
  } catch {
    // ignore
  }
}

// ─── Google Fit REST call ─────────────────────────────────────────────────────

async function fetchGoogleFitSteps(accessToken) {
  const startMs = todayMidnightMs();
  const endMs   = Date.now();

  const body = {
    aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
    bucketByTime: { durationMillis: String(endMs - startMs + 1) },
    startTimeMillis: String(startMs),
    endTimeMillis:   String(endMs),
  };

  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Fit API ${res.status}`);
  }

  const data = await res.json();
  let steps = 0;
  for (const bucket of data.bucket ?? []) {
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        for (const val of point.value ?? []) {
          steps += Number(val.intVal ?? 0);
        }
      }
    }
  }
  return steps;
}

// ─── The hook ─────────────────────────────────────────────────────────────────

export function useGoogleFitSteps() {
  const clientId   = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isAvailable = Boolean(clientId);

  const [steps,     setSteps    ] = useState(loadCachedSteps);
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading  ] = useState(false);
  const [error,     setError    ] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const clientRef   = useRef(null);
  const syncPending = useRef(false);

  // ── Sync steps using a valid access token ───
  const syncSteps = useCallback(async (accessToken) => {
    if (syncPending.current) return;
    syncPending.current = true;
    try {
      const count = await fetchGoogleFitSteps(accessToken);
      setSteps(count);
      saveCachedSteps(count);
      setConnected(true);
      setError(null);
      setLastSynced(new Date());
    } catch (err) {
      console.error("[GoogleFit] sync error:", err);
      // Token may have expired — mark disconnected so user can reconnect
      if (String(err.message).includes("401")) {
        localStorage.removeItem(TOKEN_KEY);
        setConnected(false);
        setError("Google Fit session expired. Tap Reconnect.");
      } else {
        setError("Could not sync steps from Google Fit.");
      }
    } finally {
      syncPending.current = false;
    }
  }, []);

  // ── Bootstrap: load GIS library once, auto-sync cached token ───
  useEffect(() => {
    if (!isAvailable) return;

    const existingToken = loadStoredToken();
    if (existingToken) {
      setConnected(true);
      syncSteps(existingToken.access_token);
    }

    if (document.getElementById(SCRIPT_ID)) {
      // Script already loaded (e.g. hot-reload) — just init client
      initClient();
      return;
    }

    const script = document.createElement("script");
    script.id   = SCRIPT_ID;
    script.src  = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => initClient();
    document.head.appendChild(script);

    function initClient() {
      if (!window.google?.accounts?.oauth2) return;
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: FITNESS_SCOPE,
        callback: (tokenResponse) => {
          setLoading(false);
          if (tokenResponse.error) {
            setError("Google authorisation was cancelled or denied.");
            return;
          }
          saveToken(tokenResponse);
          syncSteps(tokenResponse.access_token);
        },
        error_callback: (err) => {
          setLoading(false);
          setError("Google Fit authorisation failed.");
          console.error("[GoogleFit] auth error:", err);
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable]);

  // ── Auto-sync every 5 minutes while app is open ───
  useEffect(() => {
    if (!isAvailable || !connected) return;
    const interval = setInterval(() => {
      const token = loadStoredToken();
      if (token) syncSteps(token.access_token);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAvailable, connected, syncSteps]);

  // ── Re-sync when the page comes back to the foreground ───
  useEffect(() => {
    if (!isAvailable) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const token = loadStoredToken();
      if (token) syncSteps(token.access_token);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAvailable, syncSteps]);

  // ── Public API ───────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!clientRef.current) {
      setError("Google Sign-In is still loading — please try again in a moment.");
      return;
    }
    setLoading(true);
    setError(null);
    // Use prompt:"" first for silent sign-in; fall back to "consent" on failure
    clientRef.current.requestAccessToken({ prompt: connected ? "" : "consent" });
  }, [connected]);

  const disconnect = useCallback(() => {
    const token = loadStoredToken();
    if (token?.access_token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STEPS_KEY);
    localStorage.removeItem(DATE_KEY);
    setConnected(false);
    setSteps(0);
    setLastSynced(null);
    setError(null);
  }, []);

  const manualSync = useCallback(() => {
    const token = loadStoredToken();
    if (token) {
      syncSteps(token.access_token);
    } else {
      connect();
    }
  }, [connect, syncSteps]);

  return {
    /** Total steps counted today (background + all-day) */
    steps,
    /** Whether the user has successfully authorised Google Fit */
    connected,
    /** True while OAuth flow or API call is in progress */
    loading,
    /** Last error string, or null */
    error,
    /** False when VITE_GOOGLE_CLIENT_ID is not configured */
    isAvailable,
    /** Timestamp of the last successful sync */
    lastSynced,
    /** Opens OAuth consent screen */
    connect,
    /** Revokes token and clears all Fit state */
    disconnect,
    /** Force-refresh step count from Google Fit now */
    manualSync,
  };
}
