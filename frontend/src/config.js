// src/config.js
// ------------------------------------------------------------------
// Reads environment variables and exports a single config object.
// Shows a clear "Setup needed" notice if required values are missing.
// ------------------------------------------------------------------

/** Parse "lng,lat" string into [lng, lat] array */
function parseCenter(str) {
  if (!str) return [78.07, 11.10]; // default fallback
  const parts = str.split(',').map(Number);
  return [parts[0], parts[1]];
}

/** Parse "west,south,east,north" into a bounds object (or null) */
function parseBounds(str) {
  if (!str) return null;
  const [west, south, east, north] = str.split(',').map(Number);
  return { west, south, east, north };
}

const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  maptilerApiKey: import.meta.env.VITE_MAPTILER_API_KEY || '',

  // Optional values with defaults
  mapCenter: parseCenter(import.meta.env.VITE_MAP_CENTER),
  mapZoom:   Number(import.meta.env.VITE_MAP_ZOOM) || 13,
  demoBounds: parseBounds(import.meta.env.VITE_DEMO_BOUNDS),
};

config.isConfigured = Boolean(config.apiUrl && config.maptilerApiKey);

export default config;
