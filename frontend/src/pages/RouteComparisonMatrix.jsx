// src/pages/RouteComparisonMatrix.jsx
// ------------------------------------------------------------------
// Route Comparison page. Compares routes on real metrics only.
// Removed: mock fallback, fake grades, shade %, elevation, PM2.5
// inhalation, canopy corridor names, wind/humidity panel.
// ------------------------------------------------------------------

import React from 'react';
import { LEVEL_COLORS } from '../utils/colors';

function levelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function RouteComparisonMatrix({
  routes = [],
  selectedRouteId,
  setSelectedRouteId,
  origin,
  destination,
  profile = 'general',
  onBackToMap,
  onSelectRoute,
}) {
  // Find the fastest route to compute "AQI vs fastest" percentage
  const fastestRoute = routes.find((r) => r.isFastest) || routes[0] || null;

  /** Compute the AQI difference vs fastest route as a percentage */
  function aqiVsFastest(route) {
    if (!fastestRoute || fastestRoute.aqi === 0) return null;
    const diff = ((route.aqi - fastestRoute.aqi) / fastestRoute.aqi) * 100;
    return Math.round(diff);
  }

  /** Exposure index = avgAqi × durationMin */
  function exposureIndex(route) {
    return Math.round((route.aqi || 0) * (route.time || 0));
  }

  /** Compute clean-or-moderate segment share from segment lengths */
  function cleanShare(route) {
    if (!route.segments || route.segments.length === 0) return null;
    let totalLen = 0;
    let cleanLen = 0;

    route.segments.forEach((seg) => {
      // Approximate segment length from coordinate pairs
      const coords = seg.coords || [];
      let segLen = 0;
      for (let i = 1; i < coords.length; i++) {
        const dx = coords[i][0] - coords[i - 1][0];
        const dy = coords[i][1] - coords[i - 1][1];
        segLen += Math.sqrt(dx * dx + dy * dy);
      }
      totalLen += segLen;
      if (seg.level === 'clean' || seg.level === 'moderate') {
        cleanLen += segLen;
      }
    });

    if (totalLen === 0) return null;
    return Math.round((cleanLen / totalLen) * 100);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">

      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex items-center gap-space-md">
          <button
            onClick={onBackToMap}
            className="inline-flex items-center justify-center gap-space-xs px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-lg text-label-lg">Back to map</span>
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Profile: <span className="font-semibold text-on-surface capitalize">{profile}</span>
        </p>
      </div>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm mb-space-xl border border-surface-container">
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-space-xs">
          Route comparison
        </h1>
        {origin && destination && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {origin.label} → {destination.label}
          </p>
        )}
      </div>

      {/* Empty state */}
      {routes.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-space-2xl border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-[56px] text-outline-variant mb-space-md block">balance</span>
          <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
            Search for routes first to see them compared here.
          </p>
          <button
            onClick={onBackToMap}
            className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            Go to map
          </button>
        </div>
      )}

      {/* Comparison table */}
      {routes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="text-left font-label-md text-label-md text-on-surface-variant uppercase tracking-wider p-space-sm">
                  Metric
                </th>
                {routes.map((r) => (
                  <th
                    key={r.id}
                    className="text-left font-label-md text-label-md text-on-surface p-space-sm"
                  >
                    <div className="flex items-center gap-space-xs">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: levelColor(r.aqiLevel) }}
                      />
                      <span className="font-semibold">{r.name}</span>
                    </div>
                    {r.isRecommended && (
                      <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container mt-1 inline-block">
                        Recommended
                      </span>
                    )}
                    {r.isFastest && !r.isRecommended && (
                      <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant mt-1 inline-block">
                        Fastest
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface">
              {/* Time */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Time</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm font-data-metric text-data-metric">
                    {r.time} min
                  </td>
                ))}
              </tr>

              {/* Distance */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Distance</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm font-data-metric text-data-metric">
                    {r.distance} km
                  </td>
                ))}
              </tr>

              {/* Average AQI */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Avg AQI</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm">
                    <span className="font-data-metric text-data-metric font-bold" style={{ color: levelColor(r.aqiLevel) }}>
                      {r.aqi}
                    </span>
                    <span className="ml-1 font-data-badge text-data-badge text-on-surface-variant capitalize">
                      {r.aqiLevel}
                    </span>
                  </td>
                ))}
              </tr>

              {/* AQI vs fastest */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">AQI vs fastest</td>
                {routes.map((r) => {
                  const diff = aqiVsFastest(r);
                  return (
                    <td key={r.id} className="p-space-sm font-data-metric text-data-metric">
                      {diff === null ? '—' : diff === 0 ? 'Baseline' : `${diff > 0 ? '+' : ''}${diff}%`}
                    </td>
                  );
                })}
              </tr>

              {/* Exposure index */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">
                  Exposure index
                  <span className="block font-data-badge text-data-badge text-on-surface-variant font-normal">AQI-minutes</span>
                </td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm font-data-metric text-data-metric">
                    {exposureIndex(r)}
                  </td>
                ))}
              </tr>

              {/* Clean / moderate air share */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Clean or moderate air</td>
                {routes.map((r) => {
                  const share = cleanShare(r);
                  return (
                    <td key={r.id} className="p-space-sm">
                      {share !== null ? (
                        <div className="flex items-center gap-space-sm">
                          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: share + '%', backgroundColor: LEVEL_COLORS.clean }}
                            />
                          </div>
                          <span className="font-data-metric text-data-metric">{share}%</span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">No data yet</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Traffic */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Traffic</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm">{r.traffic || 'No data yet'}</td>
                ))}
              </tr>

              {/* Health label */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Health label</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm font-semibold">{r.healthLabel || 'No data yet'}</td>
                ))}
              </tr>

              {/* Score */}
              <tr className="border-b border-surface-container-low">
                <td className="p-space-sm text-on-surface-variant font-semibold">Score</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm font-data-metric text-data-metric text-secondary font-bold">
                    {r.score ?? '—'}
                  </td>
                ))}
              </tr>

              {/* Reason */}
              <tr>
                <td className="p-space-sm text-on-surface-variant font-semibold">Reason</td>
                {routes.map((r) => (
                  <td key={r.id} className="p-space-sm text-on-surface-variant">
                    {r.reason || '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Action row */}
          <div className="flex flex-wrap gap-space-sm mt-space-lg">
            {routes.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRoute(r.id)}
                className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                Navigate {r.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
