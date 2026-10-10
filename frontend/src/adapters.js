// src/adapters.js
// ------------------------------------------------------------------
// Converts raw API route objects into the UI shape that every page
// component expects.
//
// The pages were written against two different naming styles
// (e.g. `avgAqi` AND `aqi`, `durationMinutes` AND `time`), which left
// many fields blank. We now expose BOTH so every page gets its data.
// ------------------------------------------------------------------

/** Capitalise first letter of a string ("low" -> "Low"). */
function titleCase(s) {
  if (!s || typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Convert one API route into the UI-route object.
 */
export function toUiRoute(r, recommendedRouteId, fastestRouteId) {
  const traffic = r.traffic ?? null;
  const trafficText =
    typeof traffic === 'string' ? `${titleCase(traffic)} traffic` : null;

  return {
    id: r.id,

    // ---- name ----
    name: r.label,
    label: r.label,

    // ---- time ----
    time: r.durationMin,
    durationMinutes: r.durationMin,

    // ---- distance ----
    distance: r.distanceKm,
    distanceKm: r.distanceKm,

    // ---- air quality ----
    aqi: r.avgAqi,
    avgAqi: r.avgAqi,
    aqiLevel: r.aqiLevel,

    // ---- traffic ----
    traffic,
    trafficLevel: trafficText,

    // ---- health ----
    score: r.score,
    healthScore: r.score,
    healthLabel: r.healthLabel,
    reason: r.reason || '',

    // ---- geometry ----
    segments: r.segments || [],
    coords: r.coords || r.geometry || undefined,
    steps: Array.isArray(r.steps) ? r.steps : [],

    // ---- flags ----
    isRecommended: r.id === recommendedRouteId,
    isFastest: r.id === fastestRouteId,
  };
}

/**
 * Convert the full API response into an array of UI routes.
 */
export function convertAllRoutes(apiResponse) {
  const { recommendedRouteId, fastestRouteId, routes = [] } = apiResponse || {};

  const uiRoutes = routes.map((r) =>
    toUiRoute(r, recommendedRouteId, fastestRouteId)
  );

  return {
    routes: uiRoutes,
    recommendedId: recommendedRouteId,
    fastestId: fastestRouteId,
  };
}
