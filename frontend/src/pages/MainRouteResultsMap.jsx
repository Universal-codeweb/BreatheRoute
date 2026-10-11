// src/pages/MainRouteResultsMap.jsx
// ------------------------------------------------------------------
// Full-height interactive Map Explorer with modern floating glass UI.
// Features:
// - Full-height MapLibre map as base canvas (fast, no re-mounts)
// - Top-left floating glass search card (origin, destination, swap, find routes)
// - Floating left results panel (desktop sidebar / mobile bottom sheet)
// - Route cards with AqiBadge, time, distance, and LEVEL_COLORS exposure bar
// - "Why this route?" highlight computed from existing route telemetry
// - Bottom-left floating AQI legend with grid toggle
// - Loading Skeleton, ErrorState, and EmptyState handling
// ------------------------------------------------------------------

import React, { useState } from 'react';
import MapView from '../components/MapView';
import PlaceInput from '../components/PlaceInput';
import {
  Card,
  Button,
  AqiBadge,
  Badge,
  Skeleton,
  ErrorState,
  EmptyState,
} from '../components/ui';
import { LEVEL_COLORS } from '../utils/colors';

// Helper to compute horizontal exposure distribution bar
function getExposureSegments(route) {
  if (Array.isArray(route.segments) && route.segments.length > 0) {
    const total = route.segments.length;
    let clean = 0;
    let moderate = 0;
    let high = 0;
    let poor = 0;

    route.segments.forEach((s) => {
      const a = s.aqi || route.avgAqi || 50;
      if (a <= 50) clean++;
      else if (a <= 100) moderate++;
      else if (a <= 150) high++;
      else poor++;
    });

    return [
      { level: 'clean', pct: Math.round((clean / total) * 100), color: LEVEL_COLORS.clean },
      { level: 'moderate', pct: Math.round((moderate / total) * 100), color: LEVEL_COLORS.moderate },
      { level: 'high', pct: Math.round((high / total) * 100), color: LEVEL_COLORS.high },
      { level: 'poor', pct: Math.round((poor / total) * 100), color: LEVEL_COLORS.poor },
    ].filter((s) => s.pct > 0);
  }

  // Fallback distribution modeled from average AQI
  const aqi = route.avgAqi || 50;
  if (aqi <= 50) {
    return [
      { level: 'clean', pct: 85, color: LEVEL_COLORS.clean },
      { level: 'moderate', pct: 15, color: LEVEL_COLORS.moderate },
    ];
  }
  if (aqi <= 100) {
    return [
      { level: 'clean', pct: 40, color: LEVEL_COLORS.clean },
      { level: 'moderate', pct: 50, color: LEVEL_COLORS.moderate },
      { level: 'high', pct: 10, color: LEVEL_COLORS.high },
    ];
  }
  if (aqi <= 150) {
    return [
      { level: 'clean', pct: 15, color: LEVEL_COLORS.clean },
      { level: 'moderate', pct: 35, color: LEVEL_COLORS.moderate },
      { level: 'high', pct: 40, color: LEVEL_COLORS.high },
      { level: 'poor', pct: 10, color: LEVEL_COLORS.poor },
    ];
  }
  return [
    { level: 'clean', pct: 5, color: LEVEL_COLORS.clean },
    { level: 'moderate', pct: 20, color: LEVEL_COLORS.moderate },
    { level: 'high', pct: 35, color: LEVEL_COLORS.high },
    { level: 'poor', pct: 40, color: LEVEL_COLORS.poor },
  ];
}

// Helper to compute "Why this route?" line from existing data without inventing numbers
function getWhyThisRoute(route, fastestRoute) {
  if (!route.isRecommended) return null;

  // Use explicit reason if supplied by API
  if (route.reason && typeof route.reason === 'string' && route.reason.trim().length > 0) {
    return route.reason;
  }

  // Otherwise compute real relative particulate reduction compared to fastest route
  if (
    fastestRoute &&
    fastestRoute.id !== route.id &&
    typeof fastestRoute.avgAqi === 'number' &&
    typeof route.avgAqi === 'number' &&
    fastestRoute.avgAqi > route.avgAqi
  ) {
    const diff = fastestRoute.avgAqi - route.avgAqi;
    const reduction = Math.round((diff / fastestRoute.avgAqi) * 100);
    if (reduction > 0) {
      return `${reduction}% less pollution exposure than the fastest route`;
    }
  }

  return null;
}

export default function MainRouteResultsMap({
  routes = [],
  selectedRouteId,
  setSelectedRouteId,
  origin,
  setOrigin = () => {},
  destination,
  setDestination = () => {},
  loading = false,
  error = null,
  onFindRoutes,
  onSelectRoute,
  onStartNavigation,
  onGoToComparison,
}) {
  const [pickMode, setPickMode] = useState(null); // 'origin' | 'destination' | null
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(true);

  // Active selected route object
  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ||
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  // Fastest route reference
  const fastestRoute =
    routes.find((r) => r.isFastest) ||
    routes.find((r) => r.id !== selectedRoute?.id) ||
    routes[1] ||
    null;

  // Swap endpoints
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handlePickLocation = (loc) => {
    if (pickMode === 'origin') {
      setOrigin(loc);
    } else if (pickMode === 'destination') {
      setDestination(loc);
    }
    setPickMode(null);
  };

  const handleSelect = (routeId) => {
    if (setSelectedRouteId) setSelectedRouteId(routeId);
    if (onSelectRoute) onSelectRoute(routeId);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 flex flex-col select-none">
      {/* ============================================================
          BASE LAYER: FULL-HEIGHT MAP CANVAS (Mounted once, no re-mounts)
          ============================================================ */}
      <div className="absolute inset-0 z-0">
        <MapView
          origin={origin}
          destination={destination}
          routes={routes}
          selectedRouteId={selectedRoute?.id}
          routeColorOverride="#15803d"
          onSelectRoute={handleSelect}
          pickMode={pickMode}
          onPickLocation={handlePickLocation}
          onCancelPick={() => setPickMode(null)}
          showAqiGrid={showHeatmap}
          onToggleAqiGrid={() => setShowHeatmap((prev) => !prev)}
          className="w-full h-full"
        />
      </div>

      {/* ============================================================
          ACTIVE MAP PICK BANNER
          ============================================================ */}
      {pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#86efac] shadow-lift flex items-center gap-3 text-xs text-[#166534] animate-bounce-subtle">
          <span className="material-symbols-outlined text-[18px] text-[#15803d]">
            touch_app
          </span>
          <span>
            Click anywhere on the map to set{' '}
            <strong>{pickMode === 'origin' ? 'start location' : 'destination'}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setPickMode(null)}
            className="font-bold underline text-slate-700 hover:text-black cursor-pointer ml-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ============================================================
          DESKTOP FLOATING LEFT SIDEBAR (Search Card + Results Panel)
          ============================================================ */}
      <div className="hidden sm:flex flex-col gap-3 absolute top-4 left-4 bottom-4 z-30 w-96 pointer-events-none">
        {/* Top-Left Floating Glass Search Card */}
        <Card
          variant="glass"
          p="sm"
          className="pointer-events-auto border-white/80 shadow-lift flex flex-col gap-2.5 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-[#15803d]">
              <span className="w-2 h-2 rounded-full bg-[#15803d]" />
              <span>Corridor Search</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap origin and destination"
                className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">swap_vert</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchExpanded((prev) => !prev)}
                title="Expand inputs"
                className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {searchExpanded ? 'unfold_less' : 'unfold_more'}
                </span>
              </button>
            </div>
          </div>

          {/* PlaceInputs (Collapsible or compact view) */}
          <div className="flex flex-col gap-2">
            <PlaceInput
              label="Starting Location"
              placeholder="Start location..."
              value={origin}
              onChange={setOrigin}
              onPickOnMap={() => setPickMode('origin')}
              isPicking={pickMode === 'origin'}
            />
            <PlaceInput
              label="Destination"
              placeholder="Target destination..."
              value={destination}
              onChange={setDestination}
              onPickOnMap={() => setPickMode('destination')}
              isPicking={pickMode === 'destination'}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon="search"
            loading={loading}
            disabled={!origin || !destination}
            onClick={() => onFindRoutes && onFindRoutes()}
            className="w-full font-bold"
          >
            {loading ? 'Analyzing Corridors…' : 'Find cleanest routes'}
          </Button>
        </Card>

        {/* Floating Results Panel (Scrollable Card Container) */}
        <div className="pointer-events-auto flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          <Card
            variant="glass"
            p="sm"
            className="border-white/80 shadow-lift flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            {/* Header / Route Count */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {routes.length > 0 ? `${routes.length} Corridors Found` : 'Route Options'}
              </span>
              {selectedRoute && (
                <span className="text-[11px] font-mono font-semibold text-[#15803d]">
                  Selected: {selectedRoute.label}
                </span>
              )}
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-2 space-y-2.5">
              {/* Loading Skeleton */}
              {loading && (
                <div className="space-y-2.5">
                  <Skeleton variant="card" className="h-28 rounded-2xl" />
                  <Skeleton variant="card" className="h-28 rounded-2xl" />
                  <Skeleton variant="card" className="h-28 rounded-2xl" />
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <ErrorState
                  title="Route Calculation Failed"
                  message={error}
                  onRetry={onFindRoutes}
                  retryText="Retry"
                  className="p-4"
                />
              )}

              {/* Empty State */}
              {!loading && !error && routes.length === 0 && (
                <EmptyState
                  icon="alt_route"
                  title="No corridors yet"
                  description="Choose starting and destination waypoints to synthesize clean air routes."
                  actionText="Find Routes"
                  onAction={onFindRoutes}
                  className="p-4"
                />
              )}

              {/* Real Route Cards */}
              {!loading &&
                !error &&
                routes.map((r) => {
                  const isSelected = selectedRoute?.id === r.id;
                  const whyLine = getWhyThisRoute(r, fastestRoute);
                  const segments = getExposureSegments(r);

                  // Tag determination
                  let tag = 'Alternative';
                  let tagVariant = 'default';
                  if (r.isRecommended) {
                    tag = 'Cleanest';
                    tagVariant = 'mint';
                  } else if (r.isFastest) {
                    tag = 'Fastest';
                    tagVariant = 'outline';
                  } else if (r.healthScore && r.healthScore >= 80) {
                    tag = 'Balanced';
                    tagVariant = 'mint';
                  }

                  return (
                    <Card
                      key={r.id}
                      variant={isSelected ? 'highlight' : 'default'}
                      p="sm"
                      interactive
                      onClick={() => handleSelect(r.id)}
                      className={`transition-all duration-150 border-slate-200/90 ${
                        isSelected
                          ? 'border-2 border-[#15803d] ring-2 ring-[#86efac]/50 shadow-soft'
                          : 'hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        {/* Top: Tag + AQI Badge */}
                        <div className="flex items-center justify-between">
                          <Badge variant={tagVariant} size="sm">
                            {tag}
                          </Badge>
                          <AqiBadge aqi={r.avgAqi} animated size="sm" />
                        </div>

                        {/* Middle: Route Name + Time & Distance */}
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {r.label}
                          </h3>
                          <div className="flex items-baseline gap-1 font-mono text-xs flex-shrink-0">
                            <span className="font-bold text-slate-900 text-sm">
                              {r.durationMinutes || r.time} min
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">
                              {r.distanceKm || r.distance} km
                            </span>
                          </div>
                        </div>

                        {/* Horizontal Exposure Distribution Bar */}
                        <div className="flex flex-col gap-1 pt-0.5">
                          <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100 gap-0.5">
                            {segments.map((seg, idx) => (
                              <div
                                key={`${seg.level}-${idx}`}
                                style={{
                                  width: `${seg.pct}%`,
                                  backgroundColor: seg.color,
                                }}
                                title={`${seg.level}: ${seg.pct}%`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Exposure profile</span>
                            <span className="text-[#15803d] font-semibold">
                              Score {r.healthScore || 85}/100
                            </span>
                          </div>
                        </div>

                        {/* "Why this route?" line (strictly hidden if missing) */}
                        {whyLine && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-[#15803d] font-medium leading-snug">
                            <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">
                              verified
                            </span>
                            <span>{whyLine}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>

            {/* Bottom Actions for Selected Route */}
            {selectedRoute && (
              <div className="pt-2.5 border-t border-slate-200/60 flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  icon="navigation"
                  iconPosition="right"
                  onClick={() => onStartNavigation && onStartNavigation(selectedRoute.id)}
                  className="w-full font-bold shadow-soft"
                >
                  Start navigation
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon="balance"
                  onClick={onGoToComparison}
                  className="w-full font-semibold"
                >
                  Compare routes
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ============================================================
          BOTTOM-LEFT FLOATING LEGEND (Desktop & Mobile)
          ============================================================ */}
      <div className="absolute bottom-4 left-4 sm:left-[25.5rem] z-20 pointer-events-auto">
        <Card
          variant="glass"
          p="sm"
          className="border-white/80 shadow-lift flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs"
        >
          {/* Legend Items */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 font-mono text-[11px] uppercase tracking-wider">
              AQI Levels:
            </span>
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LEVEL_COLORS.clean }}
              />
              <span className="text-[11px] text-slate-700">Good</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LEVEL_COLORS.moderate }}
              />
              <span className="text-[11px] text-slate-700">Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LEVEL_COLORS.high }}
              />
              <span className="text-[11px] text-slate-700">High</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LEVEL_COLORS.poor }}
              />
              <span className="text-[11px] text-slate-700">Poor</span>
            </div>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200" />

          {/* Heatmap Grid Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-[#ecfdf5] text-[#15803d] border border-[#a7f3d0]'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">layers</span>
            <span>AQI Grid: {showHeatmap ? 'ON' : 'OFF'}</span>
          </button>
        </Card>
      </div>

      {/* ============================================================
          MOBILE BOTTOM SHEET (For Mobile Viewports)
          ============================================================ */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col max-h-[70vh]">
          {/* Sheet Handle */}
          <button
            type="button"
            onClick={() => setMobileSheetExpanded((prev) => !prev)}
            className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer"
            aria-label="Toggle Route Drawer"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center justify-between w-full px-4 pt-1 text-xs">
              <span className="font-bold text-slate-800">
                {routes.length > 0 ? `${routes.length} Corridors` : 'Corridor Search'}
              </span>
              <span className="text-[#15803d] font-bold">
                {mobileSheetExpanded ? 'Collapse' : 'Expand'}
              </span>
            </div>
          </button>

          {mobileSheetExpanded && (
            <div className="p-4 overflow-y-auto space-y-3">
              {/* Mobile Search Inputs */}
              <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
                <PlaceInput
                  label="Starting Location"
                  placeholder="Start location..."
                  value={origin}
                  onChange={setOrigin}
                  onPickOnMap={() => setPickMode('origin')}
                  isPicking={pickMode === 'origin'}
                />
                <PlaceInput
                  label="Destination"
                  placeholder="Target destination..."
                  value={destination}
                  onChange={setDestination}
                  onPickOnMap={() => setPickMode('destination')}
                  isPicking={pickMode === 'destination'}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="swap_vert"
                    onClick={handleSwap}
                    className="flex-1"
                  >
                    Swap
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="search"
                    loading={loading}
                    disabled={!origin || !destination}
                    onClick={() => onFindRoutes && onFindRoutes()}
                    className="flex-[2]"
                  >
                    Find routes
                  </Button>
                </div>
              </div>

              {/* Mobile Routes List */}
              <div className="space-y-2">
                {routes.map((r) => {
                  const isSelected = selectedRoute?.id === r.id;
                  const segments = getExposureSegments(r);
                  return (
                    <Card
                      key={r.id}
                      variant={isSelected ? 'highlight' : 'default'}
                      p="sm"
                      interactive
                      onClick={() => handleSelect(r.id)}
                      className={isSelected ? 'border-2 border-[#15803d]' : ''}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{r.label}</h4>
                          <span className="text-xs text-slate-500 font-mono">
                            {r.durationMinutes || r.time} min · {r.distanceKm || r.distance} km
                          </span>
                        </div>
                        <AqiBadge aqi={r.avgAqi} size="sm" />
                      </div>
                      <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100 gap-0.5 mt-2">
                        {segments.map((seg, idx) => (
                          <div
                            key={`${seg.level}-${idx}`}
                            style={{
                              width: `${seg.pct}%`,
                              backgroundColor: seg.color,
                            }}
                          />
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Mobile CTAs */}
              {selectedRoute && (
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    icon="navigation"
                    onClick={() => onStartNavigation && onStartNavigation(selectedRoute.id)}
                    className="w-full"
                  >
                    Start Navigation
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="balance"
                    onClick={onGoToComparison}
                    className="w-full"
                  >
                    Compare Routes
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
