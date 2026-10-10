// src/api.js
// ------------------------------------------------------------------
// Data-fetching layer for the BreatheRoute API.
// ------------------------------------------------------------------

import config from './config';

/** Timeout for every request (25 seconds) */
const TIMEOUT_MS = 25000;

/**
 * Fetch helper with timeout and JSON error handling.
 * The backend sends { error: "message" } on failure.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);

    // Try to parse JSON body (even errors come as JSON)
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || 'Request failed with status ' + response.status);
    }

    return body;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 25 seconds.');
    }
    throw err;
  }
}

// ------------------------------------------------------------------
// 1) POST /routes — find route options between two points
// ------------------------------------------------------------------
export async function getRoutes(origin, destination, mode, profile) {
  return fetchWithTimeout(config.apiUrl + '/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, mode, profile }),
  });
}

// ------------------------------------------------------------------
// 2) GET /aqi — fetch the AQI grid for the coverage area
// ------------------------------------------------------------------
export async function getAqiGrid() {
  return fetchWithTimeout(config.apiUrl + '/aqi');
}

// ------------------------------------------------------------------
// 3) GET /places — search places through the backend's Photon integration
// ------------------------------------------------------------------
export async function searchPlaces(query, bias) {
  const params = new URLSearchParams({ q: query });
  if (bias) params.set('proximity', `${bias.lng},${bias.lat}`);
  const data = await fetchWithTimeout(`${config.apiUrl}/places?${params}`);
  return Array.isArray(data.places) ? data.places : [];
}
