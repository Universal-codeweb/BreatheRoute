// src/utils/geo.js
// ------------------------------------------------------------------
// Geographic and regional boundary utilities for BreatheRoute.
// ------------------------------------------------------------------

import config from '../config';

/**
 * Check if coordinates fall within configured coverage bounds (if set).
 */
export function isWithinDemoBounds(lat, lng) {
  if (!config.demoBounds) return true;
  const { west, south, east, north } = config.demoBounds;
  return (
    lng >= west &&
    lng <= east &&
    lat >= south &&
    lat <= north
  );
}
