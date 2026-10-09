// src/pages/MainRouteResultsMap.jsx
// ------------------------------------------------------------------
// Map Explorer page. Shows routes and AQI data on a real map.
// Fake SVG map, mock routes fallback, sensor nodes, wind/temp/
// elevation panels all removed. Uses only the `routes` prop.
// MapView component will be added in Phase 3.
// ------------------------------------------------------------------

import React from 'react';
import { LEVEL_COLORS } from '../utils/colors';

function levelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function MainRouteResultsMap({
  routes = [],
  selectedRouteId,
  setSelectedRouteId,
  origin,
  destination,
  loading = false,
  error = null,
  onFindRoutes,
  onSelectRoute,
  onStartNavigation,
  onGoToComparison,
}) {
  // Currently selected route
  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ||
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md">

      {/* Top bar: origin → destination */}
      {origin && destination && (
        <div className="flex items-center gap-space-sm mb-space-md font-body-sm text-body-sm text-on-surface-variant">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="font-semibold text-on-surface">{origin.label}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="font-semibold text-on-surface">{destination.label}</span>
        </div>
      )}

      {/* Loading banner */}
      {loading && (
        <div className="mb-space-md p-space-sm bg-secondary-container/50 text-on-secondary-container rounded-xl flex items-center gap-2 font-body-sm text-body-sm">
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          Finding routes…
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-space-md p-space-md bg-error-container text-on-error-container rounded-xl flex items-center justify-between font-body-sm text-body-sm">
          <span className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </span>
          <button
            onClick={onFindRoutes}
            className="px-space-md py-space-xs rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">

        {/* Map Placeholder (MapView comes in Phase 3) */}
        <div className="lg:col-span-8 bg-surface-container-highest rounded-2xl overflow-hidden flex items-center justify-center min-h-[500px] border border-surface-container">
          <div className="text-center p-space-xl">
            <span className="material-symbols-outlined text-[56px] text-outline-variant mb-space-md block">map</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Interactive map will appear here once the map component is connected.
            </p>
          </div>
        </div>

        {/* Route Cards Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Routes
            </h2>
            {routes.length > 1 && (
              <button
                onClick={onGoToComparison}
                className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">balance</span>
                Compare
              </button>
            )}
          </div>

          {/* Empty state */}
          {routes.length === 0 && !loading && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 text-center">
              <span className="material-symbols-outlined text-[40px] text-outline-variant mb-space-sm block">route</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Search for a route to see results here.
              </p>
            </div>
          )}

          {/* Route cards */}
          {routes.map((r) => {
            const isSelected = r.id === (selectedRoute?.id);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`text-left w-full p-space-md rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-secondary bg-secondary-container/20 shadow-md'
                    : 'border-surface-container bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center gap-space-xs mb-space-xs">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: levelColor(r.aqiLevel) }}
                  />
                  <span className="font-label-md text-label-md text-on-surface font-bold flex-1">
                    {r.name}
                  </span>
                  {r.isRecommended && (
                    <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                      Recommended
                    </span>
                  )}
                  {r.isFastest && !r.isRecommended && (
                    <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                      Fastest
                    </span>
                  )}
                </div>

                {/* Metrics row */}
                <div className="flex flex-wrap gap-space-sm font-data-badge text-data-badge text-on-surface-variant mb-space-xs">
                  <span>{r.time} min</span>
                  <span>·</span>
                  <span>{r.distance} km</span>
                  <span>·</span>
                  <span>AQI {r.aqi}</span>
                  {r.traffic && (
                    <>
                      <span>·</span>
                      <span>{r.traffic}</span>
                    </>
                  )}
                </div>

                {/* Score + Health label */}
                <div className="flex items-center gap-space-sm">
                  {r.score != null && (
                    <span className="font-data-metric text-data-metric text-secondary font-bold">
                      {r.score}
                    </span>
                  )}
                  {r.healthLabel && (
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {r.healthLabel}
                    </span>
                  )}
                </div>

                {/* Reason */}
                {r.reason && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    {r.reason}
                  </p>
                )}

                {/* Actions (visible when selected) */}
                {isSelected && (
                  <div className="flex gap-space-sm mt-space-md pt-space-sm border-t border-surface-container">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectRoute(r.id); }}
                      className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">navigation</span>
                      Navigate
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
