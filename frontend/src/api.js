// src/api.js
// ------------------------------------------------------------------
<<<<<<< HEAD
// Data-fetching layer for BreatheRoute.
//
// Three functions, all real network calls:
//   1. getRoutes     — POST /routes to our backend
//   2. getAqiGrid    — GET  /aqi from our backend
//   3. searchPlaces  — MapTiler Geocoding API for place search
=======
// Data-fetching layer for the BreatheRoute API.
>>>>>>> af6379ec61f19f7b9f858b5a121d7ac4c1063a9e
// ------------------------------------------------------------------

import config from './config';

/** Timeout for every request (25 seconds) */
const TIMEOUT_MS = 25000;

/**
 * Fetch helper with timeout and JSON error handling.
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
<<<<<<< HEAD
// 3) MapTiler Geocoding API — search places by text
//    https://api.maptiler.com/geocoding/{query}.json?key={key}
// ------------------------------------------------------------------
export async function searchPlaces(query, bias) {
  if (!config.maptilerApiKey) {
    throw new Error('MapTiler API key is not configured.');
  }

  let url =
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
    `?key=${config.maptilerApiKey}` +
    `&limit=5` +
    `&language=en`;

  // Optional: bias results toward a specific point
  if (bias) {
    url += `&proximity=${bias.lng},${bias.lat}`;
  }

  const data = await fetchWithTimeout(url);

  // Map MapTiler GeoJSON response features to a simple { label, lat, lng } shape
  return (data.features || []).map((feature) => ({
    label: feature.place_name || feature.text || 'Unknown',
    lng: feature.center[0],
    lat: feature.center[1],
  }));
=======
// 3) GET /places — search places through the backend's Photon integration
// ------------------------------------------------------------------
export async function searchPlaces(query, bias) {
  const params = new URLSearchParams({ q: query });
  if (bias) params.set('proximity', `${bias.lng},${bias.lat}`);
  const data = await fetchWithTimeout(`${config.apiUrl}/places?${params}`);
  return Array.isArray(data.places) ? data.places : [];
>>>>>>> af6379ec61f19f7b9f858b5a121d7ac4c1063a9e
}
