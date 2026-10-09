// src/adapters.js
// ------------------------------------------------------------------
// Converts raw API route objects into the UI shape that every page
// component expects. Only maps fields that the API really provides.
// ------------------------------------------------------------------

/**
 * Convert one API route into the UI-route object.
 *
 * Kept fields: name, time, distance, aqi, aqiLevel, traffic,
 * healthLabel, score, reason, segments, isRecommended, isFastest.
 */
export function toUiRoute(r, recommendedRouteId, fastestRouteId) {
  return {
    id:            r.id,
    name:          r.label,
    time:          r.durationMin,
    distance:      r.distanceKm,
    aqi:           r.avgAqi,
    aqiLevel:      r.aqiLevel,
    traffic:       r.traffic,
    score:         r.score,
    healthLabel:   r.healthLabel,
    reason:        r.reason || '',
    segments:      r.segments || [],
    isRecommended: r.id === recommendedRouteId,
    isFastest:     r.id === fastestRouteId,
  };
}

/**
 * Convert the full API response into an array of UI routes.
 */
export function convertAllRoutes(apiResponse) {
  const { recommendedRouteId, fastestRouteId, routes } = apiResponse;

  const uiRoutes = routes.map((r) =>
    toUiRoute(r, recommendedRouteId, fastestRouteId)
  );

  return {
    routes:        uiRoutes,
    recommendedId: recommendedRouteId,
    fastestId:     fastestRouteId,
  };
}
