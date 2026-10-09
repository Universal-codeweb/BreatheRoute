// src/api.js
// ------------------------------------------------------------------
// Real-only data-fetching layer for BreatheRoute.
// Three functions, all real network calls. No mock data.
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
// 3) Amazon Location Service — search places by text
//    POST https://places.geo.{region}.amazonaws.com/v2/search-text
// ------------------------------------------------------------------
export async function searchPlaces(query, bias) {
  const url =
    'https://places.geo.' +
    config.awsRegion +
    '.amazonaws.com/v2/search-text?key=' +
    config.locationApiKey;

  const body = { QueryText: query, MaxResults: 5 };

  // Optional: bias results toward a specific point
  if (bias) {
    body.BiasPosition = [bias.lng, bias.lat]; // [lng, lat]
  }

  const data = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Map AWS response items to a simple { label, lat, lng } shape
  return (data.ResultItems || []).map((item) => ({
    label: item.Title,
    lng: item.Position[0],
    lat: item.Position[1],
  }));
}
