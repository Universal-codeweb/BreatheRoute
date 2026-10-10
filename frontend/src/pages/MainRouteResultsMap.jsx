// src/pages/MainRouteResultsMap.jsx
// ------------------------------------------------------------------
// BreatheRoute Main Route Results Map Page
// Aligned with Stitch main_route_results_map UI.
// ------------------------------------------------------------------

import React, { useState } from 'react';
import MapView from '../components/MapView';
import PlaceInput from '../components/PlaceInput';

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

  // Active selected route object
  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ||
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  // Fastest route
  const fastestRoute =
    routes.find((r) => r.isFastest) ||
    routes.find((r) => r.id !== selectedRoute?.id) ||
    routes[1] ||
    null;
  const selectedDuration = Number(selectedRoute?.durationMinutes ?? selectedRoute?.time);
  const fastestDuration = Number(fastestRoute?.durationMinutes ?? fastestRoute?.time);
  const timeDelta = Number.isFinite(selectedDuration) && Number.isFinite(fastestDuration)
    ? Math.max(0, selectedDuration - fastestDuration).toFixed(1)
    : null;

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

  return (
    <div className="w-full max-w-[1600px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md flex-1 flex flex-col gap-space-md">
      {/* Data status and selected route estimates */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-xs">
        <div className="flex items-center gap-space-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="font-data-badge text-data-badge uppercase text-secondary font-bold tracking-wider">
            Demo environmental estimates
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            AQI and traffic are not live sensor readings
          </span>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container rounded-lg">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">air</span>
            <span className="font-data-badge text-data-badge text-on-surface-variant">Route AQI: {selectedRoute?.avgAqi ?? '—'}</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container rounded-lg">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">traffic</span>
            <span className="font-data-badge text-data-badge text-on-surface-variant">Traffic estimate: {selectedRoute?.traffic ?? '—'}</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1 bg-secondary-container/70 text-on-secondary-container rounded-lg">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="font-data-badge text-data-badge font-bold">Experimental score</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/40 text-error p-space-sm rounded-xl border border-error/30 flex items-center gap-space-xs text-body-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Expandable Origin / Destination Search Bar */}
      {searchExpanded && (
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md border border-[#a7f3d0] flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-[16px] font-bold text-primary">Edit Corridors</span>
            <button
              onClick={() => setSearchExpanded(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <PlaceInput
              label="Start Origin"
              value={origin}
              onChange={setOrigin}
              onPickOnMap={() => setPickMode('origin')}
              isPicking={pickMode === 'origin'}
              placeholder="Search origin..."
            />
            <PlaceInput
              label="Target Destination"
              value={destination}
              onChange={setDestination}
              onPickOnMap={() => setPickMode('destination')}
              isPicking={pickMode === 'destination'}
              placeholder="Search destination..."
            />
          </div>
          <div className="flex justify-end gap-space-sm mt-1">
            <button
              onClick={() => {
                setSearchExpanded(false);
                onFindRoutes();
              }}
              disabled={loading || !origin || !destination}
              className="px-space-md py-2 bg-[#14532d] hover:bg-[#166534] text-white rounded-xl font-label-md text-label-md font-semibold cursor-pointer shadow-md disabled:opacity-50"
            >
              Update Routes
            </button>
          </div>
        </div>
      )}

      {/* Master 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md min-h-[780px]">

        {/* LEFT COLUMN: Interactive Map Explorer (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col relative rounded-2xl overflow-hidden bg-surface-container-low shadow-md min-h-[620px] lg:min-h-full border border-[#dcece2]">

          {/* Floating Header Search & Waypoint Strip */}
          <div
            className="absolute top-space-md left-space-md right-space-md z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-xs bg-surface-container-lowest/95 backdrop-blur-md p-space-xs rounded-xl shadow-md border border-[#a7f3d0]/60"
            style={{
              boxShadow: 'rgba(11, 28, 48, 0.12) 0px 16px 32px -4px, rgba(11, 28, 48, 0.06) 0px 6px 12px -2px',
            }}
          >
            <div
              onClick={() => setSearchExpanded(true)}
              className="flex items-center gap-space-sm px-space-sm py-1.5 flex-1 min-w-0 cursor-pointer hover:bg-surface-container-low rounded-lg transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="w-0.5 h-3 bg-outline-variant my-0.5" />
                <span className="w-3 h-3 rounded-full bg-primary-container" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">From:</span>
                  <span
                    className="text-[17px] font-semibold text-on-surface truncate tracking-tight"
                  >
                    {origin?.label || 'Click to select start location'}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">To:</span>
                  <span className="font-body-md text-[14px] text-on-surface font-semibold truncate">
                    {destination?.label || 'Click to select target destination'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-space-xs sm:self-center pr-space-xs">
              <button
                type="button"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg transition-all font-label-md text-label-md cursor-pointer ${
                  showHeatmap
                    ? 'bg-[#ecfdf5] border border-[#86efac] text-[#15803d] shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
                <span>AQI Layer: {showHeatmap ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all text-on-surface cursor-pointer"
                title="Swap Endpoints"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchExpanded(!searchExpanded)}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all text-on-surface cursor-pointer"
                title="Edit Search"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas Container */}
          <div className="w-full h-full min-h-[580px] flex-1 relative overflow-hidden bg-surface-dim/40">
            <MapView
              origin={origin}
              destination={destination}
              routes={routes}
              selectedRouteId={selectedRoute?.id}
              onSelectRoute={setSelectedRouteId}
              pickMode={pickMode}
              onPickLocation={handlePickLocation}
              onCancelPick={() => setPickMode(null)}
              showAqiGrid={showHeatmap}
              onToggleAqiGrid={() => setShowHeatmap((visible) => !visible)}
              className="w-full h-full"
            />
          </div>

          {/* Bottom Map Legend & Scale Bar */}
          <div
            className="absolute bottom-space-md left-space-md right-space-md z-20 flex flex-wrap items-center justify-between gap-space-sm px-space-md py-space-xs rounded-xl shadow-md backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(134, 239, 172, 0.5)',
              boxShadow: 'rgba(1, 45, 29, 0.12) 0px 12px 28px -4px',
            }}
          >
            <div className="flex items-center gap-space-md flex-wrap">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                Atmospheric Exposure Index:
              </span>
              <div className="flex items-center gap-space-xs">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="font-data-badge text-data-badge text-on-surface">Good (0–50)</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-3 h-3 rounded-full bg-[#EAB308]" />
                <span className="font-data-badge text-data-badge text-on-surface">Moderate (51–100)</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-3 h-3 rounded-full bg-[#F97316]" />
                <span className="font-data-badge text-data-badge text-on-surface">High (101–150)</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="font-data-badge text-data-badge text-on-surface">Poor (151–200+)</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm">
              <span className="font-data-badge text-data-badge text-on-surface-variant">GPS Accuracy: ±2.4m</span>
              <span className="w-16 h-1 bg-outline-variant rounded-full relative">
                <span className="absolute right-0 -top-3 font-data-badge text-[9px] text-on-surface-variant">500m</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Route Results & Details Panel (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">

          {/* INNOVATION SHOWCASE BANNER: Direct Visual Contrast */}
          <div
            className="rounded-2xl p-space-md shadow-md flex flex-col gap-space-sm text-white"
            style={{
              background: 'linear-gradient(135deg, rgb(1, 45, 29) 0%, rgb(15, 61, 42) 60%, rgb(3, 68, 85) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              boxShadow: 'rgba(1, 45, 29, 0.35) 0px 16px 30px -6px',
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[17px] text-[#a4f4bf]">balance</span>
                <span className="font-label-md text-[11px] uppercase tracking-[0.14em] text-[#a4f4bf] font-bold">
                  Comparative Analysis
                </span>
              </div>
              <span className="font-data-badge text-data-badge px-2.5 py-0.5 rounded-full bg-white/10 text-[#a2d1b6] border border-[#a4f4bf]/20 tabular-nums font-semibold">
                {timeDelta === null ? 'No route comparison' : `Δ ${timeDelta} min vs fastest`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-space-xs pt-1">
              {/* Selected route card */}
              <div
                className="bg-white/10 rounded-xl p-2.5 flex flex-col"
                style={{ border: '1px solid rgba(164, 244, 191, 0.25)' }}
              >
                <div className="flex items-center gap-1 text-[#a4f4bf]">
                  <span className="material-symbols-outlined text-[15px]">eco</span>
                  <span className="text-[12px] uppercase font-bold tracking-wider font-ui">Selected route</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className="text-[30px] font-semibold text-white leading-none tabular-nums"
                  >
                    {selectedRoute?.durationMinutes ?? selectedRoute?.time ?? '—'}
                  </span>
                  <span className="text-label-md font-medium text-[#7ba88f]">min</span>
                  <span className="text-[13px] text-[#7ba88f] ml-1.5 tabular-nums">
                    • {selectedRoute?.distanceKm ?? selectedRoute?.distance ?? '—'} km
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="font-data-badge text-data-badge text-[#bdedd2] tabular-nums font-semibold">
                    AQI est. {selectedRoute?.avgAqi ?? selectedRoute?.aqi ?? '—'}
                  </span>
                  <span className="font-data-badge text-[10px] bg-secondary px-1.5 py-0.5 rounded text-white font-bold tracking-wider uppercase tabular-nums">
                    Score {selectedRoute?.healthScore ?? selectedRoute?.score ?? '—'}
                  </span>
                </div>
              </div>

              {/* Fastest Card */}
              <div
                className="bg-white/5 rounded-xl p-2.5 flex flex-col"
                style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="flex items-center gap-1 text-[#c1c8c1]">
                  <span className="material-symbols-outlined text-[15px]">bolt</span>
                  <span className="text-[12px] uppercase font-bold tracking-wider font-ui">Fastest Route</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className="text-[30px] font-semibold text-[#dce9ff] leading-none tabular-nums"
                  >
                    {fastestRoute?.durationMinutes ?? fastestRoute?.time ?? '—'}
                  </span>
                  <span className="text-label-md font-medium text-[#c1c8c1]">min</span>
                  <span className="text-[13px] text-[#c1c8c1] ml-1.5 tabular-nums">
                    • {fastestRoute?.distanceKm ?? fastestRoute?.distance ?? '—'} km
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="font-data-badge text-data-badge text-[#ffdad6] tabular-nums font-semibold">
                    AQI est. {fastestRoute?.avgAqi ?? fastestRoute?.aqi ?? '—'}
                  </span>
                  <span className="font-data-badge text-[10px] bg-white/15 px-1.5 py-0.5 rounded text-[#c1c8c1] font-bold tracking-wider uppercase tabular-nums">
                    Score {fastestRoute?.healthScore ?? fastestRoute?.score ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-space-xs mt-0.5 bg-white/10 p-2 rounded-xl">
              <span className="material-symbols-outlined text-[16px] text-[#a4f4bf] flex-shrink-0 mt-0.5">
                tips_and_updates
              </span>
              <p className="text-[13px] text-[#f8f9ff] leading-relaxed">
                {selectedRoute
                  ? `Selected route has an estimated AQI of ${selectedRoute.avgAqi ?? selectedRoute.aqi ?? '—'} and a profile score of ${selectedRoute.healthScore ?? selectedRoute.score ?? '—'}/100. These values are experimental estimates.`
                  : 'Search for a route to compare its estimated AQI, traffic, and duration.'}
              </p>
            </div>
          </div>

          {/* REAL ROUTE CARDS LIST */}
          {routes.length > 0 ? (
            routes.map((r) => {
              const isSelected = selectedRoute?.id === r.id;
              const isClean = r.isRecommended || r.avgAqi <= 70;

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRouteId(r.id);
                    if (onSelectRoute) onSelectRoute(r.id);
                  }}
                  className={`route-card cursor-pointer rounded-2xl p-space-md transition-all duration-200 bg-surface-container-lowest shadow-md ${
                    isSelected
                      ? 'border-2 border-[#16a34a] shadow-lg ring-1 ring-[#22c55e]'
                      : 'border border-outline-variant/30 hover:border-secondary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                    <div
                      className={`inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full ${
                        isClean
                          ? 'bg-[#dcfce7] text-[#15803d] border border-[#86efac]'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isClean ? 'eco' : 'speed'}
                      </span>
                      <span className="font-label-md text-label-md font-bold tracking-tight">
                        {r.isRecommended ? 'BEST FOR YOUR HEALTH' : r.isFastest ? 'FASTEST DIRECT' : 'ALTERNATIVE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-[18px]">
                        {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span className="font-label-md text-label-md font-semibold">
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-space-xs">
                    <h3
                      className="text-[24px] font-semibold text-on-surface leading-tight tracking-tight"
                    >
                      {r.label}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[28px] font-semibold text-primary leading-none tabular-nums"
                      >
                        {r.durationMinutes}
                      </span>
                      <span className="font-label-md font-semibold text-on-surface-variant font-ui">min</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm mt-1 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="tabular-nums font-semibold">{r.distanceKm} km</span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        r.avgAqi <= 50
                          ? 'text-[#15803d]'
                          : r.avgAqi <= 100
                          ? 'text-[#ca8a04]'
                          : 'text-error'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.avgAqi <= 50 ? 'bg-[#15803d]' : r.avgAqi <= 100 ? 'bg-[#ca8a04]' : 'bg-error'
                        }`}
                      />{' '}
                      AQI {r.avgAqi} ({r.avgAqi <= 50 ? 'Pristine' : r.avgAqi <= 100 ? 'Moderate' : 'Poor'})
                    </span>
                    <span>•</span>
                    <span className="text-secondary">{r.trafficLevel || 'Low Traffic'}</span>
                  </div>

                  {/* Composite Health Score Bar */}
                  <div className="mt-space-sm bg-surface-container rounded-xl p-space-sm flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                        Composite Health Score
                      </span>
                      <span
                        className="italic text-[15px] text-secondary font-medium"
                      >
                        {isClean ? 'Minimal Respiratory Load' : 'Elevated Soot Exposure'}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <div
                        className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-[20px] font-bold tabular-nums"
                        style={{
                          border: '1.5px solid rgb(136, 215, 165)',
                        }}
                      >
                        {r.healthScore || 85}
                      </div>
                      <span className="font-ui text-label-md font-medium text-on-surface-variant tabular-nums">
                        /100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-[#a7f3d0] text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[36px] text-secondary">explore</span>
              <p className="font-headline-sm text-primary font-bold">Search corridors to compare routes</p>
              <p className="font-body-sm text-on-surface-variant">
                Select your origin and destination using the top bar or pick on the map.
              </p>
            </div>
          )}

          {/* Action CTAs */}
          {selectedRoute && (
            <div className="flex flex-col gap-space-xs mt-1">
              <button
                type="button"
                onClick={() => onStartNavigation(selectedRoute.id)}
                className="w-full h-13 rounded-2xl bg-[#14532d] hover:bg-[#166534] text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Start Live Navigation</span>
                <span className="material-symbols-outlined text-[20px]">navigation</span>
              </button>

              <button
                type="button"
                onClick={onGoToComparison}
                className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">balance</span>
                <span>Open Full Comparison Matrix</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
