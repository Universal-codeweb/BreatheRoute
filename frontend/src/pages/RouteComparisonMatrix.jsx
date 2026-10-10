// src/pages/RouteComparisonMatrix.jsx
// ------------------------------------------------------------------
// BreatheRoute Route Comparison Matrix Page
// Aligned with Stitch route_comparison_matrix UI.
// ------------------------------------------------------------------

import React, { useState } from 'react';

function getAqiCategory(value) {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'High';
  return 'Poor';
}

function getRouteTime(route) {
  return Number(route?.durationMinutes ?? route?.time);
}

function getBarWidth(value, max = 100) {
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) ? Math.max(0, Math.min(100, (numericValue / max) * 100)) : 0}%`;
}

export default function RouteComparisonMatrix({
  routes = [],
  selectedRouteId,
  setSelectedRouteId = () => {},
  origin,
  destination,
  profile = 'general',
  _loading = false,
  _error = null,
  onBackToMap,
  onSelectRoute,
  onStartNavigation,
  onProfileChange,
}) {
  const [activeProfile, setActiveProfile] = useState(profile || 'general');

  // Identify recommended (cleanest), fastest, and alternative routes
  const recommendedRoute =
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  const fastestRoute =
    routes.find((r) => r.isFastest && r.id !== recommendedRoute?.id) ||
    null;

  const alternativeRoute =
    routes.find((r) => r.id !== recommendedRoute?.id && r.id !== fastestRoute?.id) ||
    routes[2] ||
    null;
  const fastestDuration = getRouteTime(fastestRoute);
  const recommendedDuration = getRouteTime(recommendedRoute);
  const recommendedTimeDelta = Number.isFinite(fastestDuration) && Number.isFinite(recommendedDuration)
    ? Math.max(0, recommendedDuration - fastestDuration).toFixed(1)
    : null;

  const handleSelectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    if (onSelectRoute) onSelectRoute(routeId);
  };

  const activeRoute = routes.find((route) => route.id === selectedRouteId) || recommendedRoute;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex-1 flex flex-col gap-space-lg">
      {/* Top Action & Navigation Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xs">
        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={onBackToMap}
            className="inline-flex items-center justify-center gap-space-xs px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition-all shadow-sm font-label-lg text-label-lg font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Map</span>
          </button>
          <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded-full border border-[#a7f3d0]/60">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="font-data-badge text-data-badge text-on-surface-variant uppercase tracking-wider">
              AQI and traffic estimates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-xl transition-all shadow-sm border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">share</span>
            <span className="font-label-md text-label-md font-semibold">Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="relative bg-surface-container-lowest rounded-3xl p-space-lg md:p-space-xl shadow-sm border border-[#dcece2] overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary-container mb-space-xs">
            <span className="material-symbols-outlined text-[14px]">analytics</span>
            <span className="font-data-badge text-data-badge tracking-wider uppercase font-semibold">
              Multi-Parametric Route Matrix
            </span>
          </div>
          <h1
            className="text-[36px] md:text-[50px] leading-[1.08] text-primary font-bold tracking-tight"
          >
            Compare Your <span className="italic font-normal text-secondary">Routes</span>
          </h1>
          <p
            className="text-[17px] md:text-[19px] leading-[1.5] text-on-surface-variant mt-space-xs font-ui"
          >
              Comparing route duration and experimental AQI/traffic scores between{' '}
            <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-[#ecfdf5] border border-[#a7f3d0]">
              {origin?.label || 'Selected Origin'}
            </span>{' '}
            and{' '}
            <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-[#ecfdf5] border border-[#a7f3d0]">
              {destination?.label || 'Target Destination'}
            </span>.
          </p>
        </div>

        {/* Health Profile Filter Tabs */}
        <div className="mt-space-lg pt-space-lg bg-surface-container-low/60 -mx-space-lg md:-mx-space-xl px-space-lg md:px-space-xl border-t border-[#a7f3d0]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">vital_signs</span>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                Target Health Profile:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              {[
                { id: 'general', label: 'General Commuter', icon: 'directions_walk' },
                { id: 'asthma', label: 'Asthma', icon: 'pulmonology' },
                { id: 'elderly', label: 'Elderly', icon: 'elderly' },
                { id: 'child', label: 'Child', icon: 'child_care' },
              ].map((p) => {
                const isActive = activeProfile === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setActiveProfile(p.id); if (onProfileChange) onProfileChange(p.id); }}
                    className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md transition-all flex items-center gap-space-xs cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Recommendation Callout Banner */}
      <div
        className="rounded-2xl p-space-md md:p-space-lg shadow-sm border border-[#a7f3d0]"
        style={{
          background: 'linear-gradient(135deg, rgb(240, 253, 244) 0%, rgb(220, 252, 231) 100%)',
          boxShadow: 'rgba(21, 128, 61, 0.08) 0px 4px 16px',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md border border-[#a7f3d0]"
              style={{ background: 'linear-gradient(135deg, rgb(5, 150, 105) 0%, rgb(21, 128, 61) 100%)' }}
            >
              <span className="material-symbols-outlined text-[26px]">eco</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="font-data-badge text-data-badge uppercase font-bold text-[#166534] tracking-wider">
                  ALGORITHMIC RECOMMENDATION
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span className="font-data-badge text-data-badge text-secondary font-bold px-2 py-0.5 rounded-full bg-white/80 border border-[#a7f3d0]">
                  Profile-weighted score
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                Why we recommend {recommendedRoute?.label || 'the selected route'}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                {recommendedRoute
                  ? `${recommendedRoute.label} is recommended for the ${activeProfile} profile with a score of ${recommendedRoute.healthScore ?? '—'}/100, an AQI estimate of ${recommendedRoute.avgAqi ?? '—'} (${getAqiCategory(recommendedRoute.avgAqi)}), and ${recommendedTimeDelta ?? '—'} min vs the fastest route.`
                  : 'Choose a route to see its experimental profile score and AQI estimate.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-sm shrink-0 self-end md:self-auto">
            <div className="px-space-md py-space-sm rounded-xl bg-white/90 shadow-sm border border-[#a7f3d0] flex items-center gap-space-xs">
              <div className="w-7 h-7 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
              </div>
              <span className="font-data-metric text-data-metric font-bold text-secondary tracking-tight">
                {getAqiCategory(recommendedRoute?.avgAqi)}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                AQI estimate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Route Side-by-Side Cards (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        {/* Fastest Route Card */}
        {fastestRoute && (
          <div
            className={`relative bg-surface-container-lowest rounded-2xl p-space-lg flex flex-col justify-between shadow-sm border ${selectedRouteId === fastestRoute.id ? 'border-secondary ring-2 ring-secondary/30' : 'border-surface-container'}`}
          >
            <div>
              <div className="flex items-center justify-between gap-space-xs mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center font-bold text-sm text-on-surface-variant border border-outline-variant/30">
                    A
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-[0.06em] block">
                      Fastest available route
                    </span>
                    <h3
                      className="text-[22px] text-on-surface font-bold tracking-tight"
                    >
                      ⚡ {fastestRoute.label || 'Fastest Route'}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-data-badge text-[11px] font-bold tracking-wider uppercase">
                  AQI {getAqiCategory(fastestRoute.avgAqi)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-space-xs mb-space-md">
                <div className="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                  <span className="text-[12px] font-medium text-on-surface-variant block">Travel Time</span>
                  <span className="text-[22px] text-on-surface font-bold tracking-tight block tabular-nums">
                    {fastestRoute.durationMinutes} <span className="text-[14px] font-normal text-on-surface-variant">min</span>
                  </span>
                  <span className="text-[11px] text-secondary font-semibold uppercase tracking-wider block mt-0.5 font-data-badge">
                    Fastest pace
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-xl p-space-sm border border-surface-container">
                  <span className="text-[12px] font-medium text-on-surface-variant block">Distance</span>
                  <span className="text-[22px] text-on-surface font-bold tracking-tight block tabular-nums">
                    {fastestRoute.distanceKm} <span className="text-[14px] font-normal text-on-surface-variant">km</span>
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mt-0.5 font-data-badge">
                    Modeled route estimate
                  </span>
                </div>
              </div>

              <div className="space-y-space-md text-on-surface">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">air</span> Avg. AQI
                    </span>
                    <span className="text-[17px] text-error font-bold tracking-tight font-data-badge">
                      {fastestRoute.avgAqi ?? '—'} {getAqiCategory(fastestRoute.avgAqi)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-error rounded-full" style={{ width: getBarWidth(fastestRoute.avgAqi, 200) }} />
                  </div>
                  <span className="text-[11px] text-on-surface-variant block mt-1 tracking-tight">
                    Heavy tailpipe emissions along arterial traffic
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">ecg</span> Profile Score
                    </span>
                    <span className="text-[17px] text-on-surface font-bold tracking-tight font-data-badge">
                      {fastestRoute.healthScore ?? '—'} <span className="text-[13px] font-normal text-on-surface-variant">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-error/70 rounded-full" style={{ width: getBarWidth(fastestRoute.healthScore) }} />
                  </div>
                </div>

                <div className="pt-space-sm space-y-space-xs text-[13px]">
                  <div className="flex justify-between py-1.5 bg-surface-container-low px-space-sm rounded-lg">
                    <span className="text-on-surface-variant">Traffic Intensity</span>
                    <span className="font-semibold text-on-surface">{fastestRoute.traffic ?? '—'} / 100</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-surface-container-low px-space-sm rounded-lg">
                    <span className="text-on-surface-variant">Data source</span>
                    <span className="font-semibold text-on-surface">Modeled estimate</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-surface-container-low px-space-sm rounded-lg">
                    <span className="text-on-surface-variant">Route label</span>
                    <span className="font-semibold text-on-surface">{fastestRoute.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-sm">
              <button
                type="button"
                onClick={() => handleSelectRoute(fastestRoute.id)}
                className={`w-full h-11 rounded-xl font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs cursor-pointer border ${selectedRouteId === fastestRoute.id ? 'bg-[#ecfdf5] text-[#14532d] border-[#86efac]' : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{selectedRouteId === fastestRoute.id ? 'check' : 'bolt'}</span>
                <span>{selectedRouteId === fastestRoute.id ? 'Selected' : 'Select fastest'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Cleanest Recommended Route Card (Center Highlight) */}
        {recommendedRoute && (
          <div
            className={`relative bg-white rounded-2xl p-space-lg flex flex-col justify-between shadow-xl transition-all duration-300 border-2 ${selectedRouteId === recommendedRoute.id ? 'ring-2 ring-secondary border-[#15803d]' : 'border-[#dcece2]'}`}
            style={{
              boxShadow: 'rgb(134, 239, 172) 0px 14px 0px 0px, rgba(20, 83, 45, 0.18) 0px 20px 32px',
            }}
          >
            {/* Top Recommended Floating Badge */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-space-md py-1.5 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.08em] flex items-center gap-1.5 shadow-md border border-[#a7f3d0] font-data-badge"
              style={{ background: 'linear-gradient(90deg, rgb(21, 128, 61) 0%, rgb(22, 101, 52) 100%)' }}
            >
              <span className="material-symbols-outlined text-[15px]">verified</span>
              RECOMMENDED CHOICE
            </div>

            <div>
              <div className="flex items-center justify-between gap-space-xs mb-space-md mt-1">
                <div className="flex items-center gap-space-xs">
                  <span className="w-9 h-9 rounded-xl bg-[#dcfce7] flex items-center justify-center text-[#15803d] font-bold text-sm border border-[#86efac]">
                    B
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.06em] block">
                      Recommended route
                    </span>
                    <h3
                      className="text-[22px] text-primary font-bold tracking-tight"
                    >
                      🌱 {recommendedRoute.label || 'Cleanest Route'}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534] font-data-badge text-[11px] font-bold tracking-wider uppercase border border-[#86efac]">
                  Score {recommendedRoute.healthScore ?? '—'}/100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-space-xs mb-space-md">
                <div className="bg-[#f0fdf4] rounded-xl p-space-sm border border-[#a7f3d0]">
                  <span className="text-[12px] font-semibold text-[#166534] block">Travel Time</span>
                  <span className="text-[22px] text-primary font-bold tracking-tight block tabular-nums">
                    {recommendedRoute.durationMinutes} <span className="text-[14px] font-normal text-on-surface-variant">min</span>
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mt-0.5 font-data-badge">
                    {recommendedTimeDelta ?? '—'} min vs fastest
                  </span>
                </div>
                <div className="bg-[#f0fdf4] rounded-xl p-space-sm border border-[#a7f3d0]">
                  <span className="text-[12px] font-semibold text-[#166534] block">Distance</span>
                  <span className="text-[22px] text-primary font-bold tracking-tight block tabular-nums">
                    {recommendedRoute.distanceKm} <span className="text-[14px] font-normal text-on-surface-variant">km</span>
                  </span>
                  <span className="text-[11px] text-secondary uppercase tracking-wider block font-bold mt-0.5 font-data-badge">
                    Modeled route estimate
                  </span>
                </div>
              </div>

              <div className="space-y-space-md text-on-surface">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">air</span> Avg. AQI
                    </span>
                    <span className="text-[17px] text-secondary font-bold tracking-tight font-data-badge">
                      {recommendedRoute.avgAqi} Moderate
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '38%' }} />
                  </div>
                  <span className="text-[11px] text-secondary block mt-1 font-semibold tracking-tight">
                    AQI is estimated from sampled route points.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">ecg</span> Respiratory Score
                    </span>
                    <span className="text-[17px] text-secondary font-bold tracking-tight font-data-badge">
                      {recommendedRoute.healthScore || 89} <span className="text-[13px] font-normal text-on-surface-variant">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '89%' }} />
                  </div>
                </div>

                <div className="pt-space-sm space-y-space-xs text-[13px]">
                  <div className="flex justify-between py-1.5 bg-[#f0fdf4] px-space-sm rounded-lg border border-[#d1fae5]">
                    <span className="text-on-surface-variant">Traffic Intensity</span>
                    <span className="font-bold text-primary">{recommendedRoute.traffic ?? '—'} / 100</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-[#f0fdf4] px-space-sm rounded-lg border border-[#d1fae5]">
                    <span className="text-on-surface-variant">Data source</span>
                    <span className="font-semibold text-on-surface">Modeled estimate</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-[#f0fdf4] px-space-sm rounded-lg border border-[#d1fae5]">
                    <span className="text-on-surface-variant">Profile</span>
                    <span className="font-bold text-primary">{activeProfile}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-sm">
              <button
                type="button"
                onClick={() => handleSelectRoute(recommendedRoute.id)}
                className={`w-full h-11 rounded-xl font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs cursor-pointer border ${selectedRouteId === recommendedRoute.id ? 'bg-[#ecfdf5] text-[#14532d] border-[#86efac]' : 'bg-surface-container-lowest text-[#14532d] border-[#a7f3d0] hover:bg-[#ecfdf5]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{selectedRouteId === recommendedRoute.id ? 'check' : 'eco'}</span>
                <span>{selectedRouteId === recommendedRoute.id ? 'Selected' : 'Select recommended'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Alternative Route Card */}
        {alternativeRoute && (
          <div
            className="relative bg-white rounded-2xl p-space-lg flex flex-col justify-between shadow-sm border border-[#99f6e4]"
            style={{
              boxShadow: 'rgb(204, 251, 241) 0px 8px 0px 0px, rgba(15, 118, 110, 0.08) 0px 16px 24px',
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-space-xs mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="w-9 h-9 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center font-bold text-sm border border-[#99f6e4]">
                    C
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-[#0f766e] uppercase tracking-[0.06em] block">
                      Alternative route
                    </span>
                    <h3
                      className="text-[22px] text-[#0f766e] font-bold tracking-tight"
                    >
                      🌿 {alternativeRoute.label || 'Ultra Clean'}
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#ccfbf1] text-[#0f766e] font-data-badge text-[11px] font-bold tracking-wider uppercase border border-[#99f6e4]">
                  AQI {getAqiCategory(alternativeRoute.avgAqi)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-space-xs mb-space-md">
                <div className="bg-[#f0fdfa] rounded-xl p-space-sm border border-[#ccfbf1]">
                  <span className="text-[12px] font-medium text-[#0f766e] block">Travel Time</span>
                  <span className="text-[22px] text-on-surface font-bold tracking-tight block tabular-nums">
                    {alternativeRoute.durationMinutes} <span className="text-[14px] font-normal text-on-surface-variant">min</span>
                  </span>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block mt-0.5 font-data-badge">
                    {Math.max(0, getRouteTime(alternativeRoute) - fastestDuration).toFixed(1)} min vs fastest
                  </span>
                </div>
                <div className="bg-[#f0fdfa] rounded-xl p-space-sm border border-[#ccfbf1]">
                  <span className="text-[12px] font-medium text-[#0f766e] block">Distance</span>
                  <span className="text-[22px] text-on-surface font-bold tracking-tight block tabular-nums">
                    {alternativeRoute.distanceKm} <span className="text-[14px] font-normal text-on-surface-variant">km</span>
                  </span>
                  <span className="text-[11px] text-[#0f766e] uppercase tracking-wider block font-bold mt-0.5 font-data-badge">
                    Route distance
                  </span>
                </div>
              </div>

              <div className="space-y-space-md text-on-surface">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">air</span> Avg. AQI
                    </span>
                    <span className="text-[17px] text-secondary font-bold tracking-tight font-data-badge">
                      {alternativeRoute.avgAqi} Good
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-[#2dd4bf] rounded-full" style={{ width: '25%' }} />
                  </div>
                  <span className="text-[11px] text-secondary block mt-1 font-semibold tracking-tight">
                    AQI is estimated from sampled route points.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-on-surface-variant flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px]">ecg</span> Respiratory Score
                    </span>
                    <span className="text-[17px] text-secondary font-bold tracking-tight font-data-badge">
                      {alternativeRoute.healthScore || 94} <span className="text-[13px] font-normal text-on-surface-variant">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                <div className="pt-space-sm space-y-space-xs text-[13px]">
                  <div className="flex justify-between py-1.5 bg-[#f0fdfa] px-space-sm rounded-lg border border-[#ccfbf1]">
                    <span className="text-on-surface-variant">Traffic Intensity</span>
                    <span className="font-semibold text-[#0f766e]">{alternativeRoute.traffic ?? '—'} / 100</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-[#f0fdfa] px-space-sm rounded-lg border border-[#ccfbf1]">
                    <span className="text-on-surface-variant">Data source</span>
                    <span className="font-semibold text-on-surface">Modeled estimate</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-[#f0fdfa] px-space-sm rounded-lg border border-[#ccfbf1]">
                    <span className="text-on-surface-variant">Profile</span>
                    <span className="font-bold text-primary">{activeProfile}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-lg pt-space-sm">
              <button
                type="button"
                onClick={() => handleSelectRoute(alternativeRoute.id)}
                className={`w-full h-11 rounded-xl font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs cursor-pointer border ${selectedRouteId === alternativeRoute.id ? 'bg-[#ccfbf1] text-[#0f766e] border-[#5eead4]' : 'bg-surface-container-lowest text-[#0f766e] border-[#99f6e4] hover:bg-[#f0fdfa]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{selectedRouteId === alternativeRoute.id ? 'check' : 'alt_route'}</span>
                <span>{selectedRouteId === alternativeRoute.id ? 'Selected' : 'Select alternative'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-space-sm">
        <p className="mr-auto text-body-sm text-on-surface-variant">
          Selected: <span className="font-semibold text-on-surface">{activeRoute?.label || 'No route'}</span>
        </p>
        <button
          type="button"
          onClick={() => activeRoute && onStartNavigation?.(activeRoute.id)}
          disabled={!activeRoute}
          className="inline-flex min-h-11 items-center justify-center gap-space-xs rounded-xl bg-[#14532d] px-space-lg text-white font-label-md text-label-md font-semibold shadow-sm transition-colors hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">navigation</span>
          Start selected route
        </button>
      </div>

      {/* Deep-Dive Analytical Matrix Table */}
      <div
        className="bg-surface-container-lowest rounded-3xl p-space-lg md:p-space-xl shadow-sm mb-space-2xl overflow-hidden border border-[#dcece2]"
        style={{
          boxShadow: 'rgb(220, 233, 255) 0px 10px 0px 0px, rgba(11, 28, 48, 0.08) 0px 18px 28px',
        }}
      >
        <div className="flex items-center justify-between mb-space-lg">
          <div>
            <h2
              className="text-[26px] md:text-[30px] leading-tight text-primary font-bold tracking-tight"
            >
              Route <span className="italic font-normal text-secondary">Score Details</span>
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Experimental AQI and traffic estimates along candidate corridors; not live measurements.
            </p>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 font-data-badge text-data-badge text-on-surface-variant bg-surface-container px-space-sm py-1 rounded-full border border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px]">info</span> Estimate only
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-surface-container">
          <table className="w-full text-left border-collapse font-ui">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[13px] uppercase tracking-wider font-semibold">
                <th className="py-space-md px-space-md font-bold">Route</th>
                <th className="py-space-md px-space-md font-bold">Distance</th>
                <th className="py-space-md px-space-md font-bold">Est. time</th>
                <th className="py-space-md px-space-md font-bold">AQI estimate</th>
                <th className="py-space-md px-space-md font-bold">Traffic estimate</th>
                <th className="py-space-md px-space-md font-bold">Profile score</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-on-surface divide-y divide-surface-container">
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className="py-space-md px-space-md font-semibold text-primary">
                    {route.label || route.name || route.id}
                    {route.isRecommended && <span className="ml-2 text-[11px] text-secondary"> Recommended</span>}
                  </td>
                  <td className="py-space-md px-space-md font-data-badge">{route.distanceKm ?? '—'} km</td>
                  <td className="py-space-md px-space-md font-data-badge">{route.durationMinutes ?? route.time ?? '—'} min</td>
                  <td className="py-space-md px-space-md font-data-badge">{route.avgAqi ?? '—'} · {getAqiCategory(route.avgAqi)}</td>
                  <td className="py-space-md px-space-md font-data-badge">{route.traffic ?? '—'} / 100</td>
                  <td className="py-space-md px-space-md font-data-badge">{route.healthScore ?? route.score ?? '—'} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
