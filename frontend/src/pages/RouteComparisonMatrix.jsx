// src/pages/RouteComparisonMatrix.jsx
// ------------------------------------------------------------------
// BreatheRoute Multi-Parametric Route Comparison Matrix
// Premium side-by-side evaluation of clean air corridors.
// ------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  AqiBadge,
  Badge,
  SectionLabel,
  Skeleton,
  ErrorState,
  EmptyState,
} from '../components/ui';
import { LEVEL_COLORS } from '../utils/colors';

function getAqiCategory(value) {
  if (!Number.isFinite(Number(value))) return 'Unavailable';
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'High';
  return 'Poor';
}

function getRouteTime(route) {
  return Number(route?.durationMinutes ?? route?.time ?? 0);
}

function getBarWidth(value, max = 100) {
  const numericValue = Number(value);
  return `${Number.isFinite(numericValue) ? Math.max(0, Math.min(100, (numericValue / max) * 100)) : 0}%`;
}

function getAqiColor(aqi) {
  if (!Number.isFinite(Number(aqi))) return '#94a3b8';
  if (aqi <= 50) return LEVEL_COLORS.clean;
  if (aqi <= 100) return LEVEL_COLORS.moderate;
  if (aqi <= 150) return LEVEL_COLORS.high;
  return LEVEL_COLORS.poor;
}

export default function RouteComparisonMatrix({
  routes = [],
  selectedRouteId,
  setSelectedRouteId = () => {},
  origin,
  destination,
  profile = 'general',
  loading = false,
  _loading = false,
  error = null,
  _error = null,
  onBackToMap,
  onSelectRoute,
  onStartNavigation,
  onProfileChange,
}) {
  const isBusy = loading || _loading;
  const failure = error || _error;

  const [customProfile, setCustomProfile] = useState(null);
  const activeProfile = customProfile || profile || 'general';
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const recommendedRoute =
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  const fastestRoute =
    routes.find((r) => r.isFastest && r.id !== recommendedRoute?.id) ||
    routes.find((r) => r.isFastest) ||
    routes[1] ||
    null;

  const activeSelectedId = selectedRouteId || recommendedRoute?.id;
  const selectedRoute =
    routes.find((r) => r.id === activeSelectedId) ||
    recommendedRoute;

  const recommendedDuration = getRouteTime(recommendedRoute);
  const fastestDuration = getRouteTime(fastestRoute);
  const timeDelta =
    Number.isFinite(fastestDuration) && Number.isFinite(recommendedDuration)
      ? Math.max(0, Math.round(recommendedDuration - fastestDuration))
      : 0;

  let pollutionReduction = 0;
  if (
    fastestRoute?.avgAqi &&
    recommendedRoute?.avgAqi &&
    fastestRoute.avgAqi > recommendedRoute.avgAqi
  ) {
    pollutionReduction = Math.round(
      ((fastestRoute.avgAqi - recommendedRoute.avgAqi) / fastestRoute.avgAqi) * 100
    );
  }

  const handleSelect = (routeId) => {
    setSelectedRouteId(routeId);
    if (onSelectRoute) onSelectRoute(routeId);
  };

  const handleProfileSwitch = (newProfile) => {
    setCustomProfile(newProfile);
    if (onProfileChange) onProfileChange(newProfile);
  };

  const validTimes = routes.map((r) => getRouteTime(r)).filter(Number.isFinite);
  const minTime = validTimes.length ? Math.min(...validTimes) : null;

  const validDistances = routes.map((r) => Number(r.distanceKm ?? r.distance)).filter(Number.isFinite);
  const minDist = validDistances.length ? Math.min(...validDistances) : null;

  const validAqis = routes.map((r) => Number(r.avgAqi ?? r.aqi)).filter(Number.isFinite);
  const minAqi = validAqis.length ? Math.min(...validAqis) : null;

  const validScores = routes.map((r) => Number(r.healthScore ?? r.score)).filter(Number.isFinite);
  const maxScore = validScores.length ? Math.max(...validScores) : null;

  if (isBusy) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        <Skeleton variant="card" className="h-44 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-96 rounded-2xl" />
          <Skeleton variant="card" className="h-96 rounded-2xl" />
          <Skeleton variant="card" className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (failure) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ErrorState
          title="Unable to load route matrix"
          message={failure}
          onRetry={onBackToMap}
          retryText="Return to Map"
        />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon="balance"
          title="No routes to compare yet"
          description="Plan a route with origin and destination waypoints to generate and compare atmospheric corridors side by side."
          actionText="Back to Route Planner"
          onAction={onBackToMap}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 flex flex-col gap-8 pb-32">
      {/* -------------------------------------------------------------
          TOP BAR: BACK BUTTON & PROFILE SELECTOR
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon="arrow_back"
            onClick={onBackToMap}
            className="shadow-2xs bg-white hover:bg-slate-50"
          >
            Back to map
          </Button>

          <div>
            <SectionLabel type="bracket" label="Comparative Corridor Intelligence" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Route Comparison Matrix
            </h1>
          </div>
        </div>

        {/* Profile Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full border border-slate-200/60 shadow-2xs">
          {[
            { id: 'general', label: 'General', icon: 'person' },
            { id: 'asthma', label: 'Asthma', icon: 'air' },
            { id: 'elderly', label: 'Elderly', icon: 'nature_people' },
            { id: 'child', label: 'Child', icon: 'child_care' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProfileSwitch(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeProfile === p.id
                  ? 'bg-white text-[#15803d] shadow-xs font-extrabold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TOP: ALGORITHMIC VERDICT HERO BANNER
          ------------------------------------------------------------- */}
      {recommendedRoute && (
        <Card
          variant="highlight"
          p="lg"
          className="bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-[#86efac]/80 shadow-soft relative overflow-hidden rounded-3xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#15803d] text-white text-[11px] font-bold tracking-wide">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  ALGORITHMIC VERDICT
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">·</span>
                <span className="text-xs font-mono font-semibold text-[#15803d]">
                  Optimized for {activeProfile.toUpperCase()} profile
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Recommended:{' '}
                <span className="text-[#15803d]">{recommendedRoute.label || recommendedRoute.name || 'Clean Corridor'}</span>
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {recommendedRoute.reason ||
                  'Delivers maximum botanical canopy coverage and the lowest cumulative particulate inhalation with minimal travel delay.'}
              </p>

              {/* Trade-off summary pills */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#86efac] text-xs font-mono font-bold text-[#15803d] shadow-2xs">
                  <span className="material-symbols-outlined text-[15px]">eco</span>
                  <span>
                    {pollutionReduction > 0 ? `-${pollutionReduction}% air pollution` : 'Optimal clean air'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-700 shadow-2xs">
                  <span className="material-symbols-outlined text-[15px] text-slate-500">pace</span>
                  <span>+{timeDelta} min pace trade-off</span>
                </div>

                {(origin?.label || destination?.label) && (
                  <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
                    from {origin?.label || 'Origin'} to {destination?.label || 'Destination'}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics Group & Quick CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/95 p-3.5 rounded-2xl border border-[#bbf7d0] shadow-2xs flex flex-col items-center text-center min-w-[110px]">
                  <AqiBadge
                    aqi={recommendedRoute.avgAqi}
                    animated
                    size="md"
                    className="mb-1"
                  />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Avg. Exposure
                  </span>
                </div>

                <div className="bg-white/95 p-3.5 rounded-2xl border border-[#bbf7d0] shadow-2xs flex flex-col items-center text-center min-w-[110px]">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {recommendedRoute.durationMinutes || recommendedRoute.time} min
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mt-1">
                    Travel Time
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                icon="navigation"
                iconPosition="right"
                onClick={() => onStartNavigation && onStartNavigation(recommendedRoute.id)}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold shadow-md h-10"
              >
                Navigate Recommended
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------------------
          SIDE-BY-SIDE CORRIDOR COMPARISON CARDS (GRID)
          ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#15803d]">alt_route</span>
            Candidate Corridors ({routes.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click card to select corridor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {routes.map((r, idx) => {
            const isRec = r.id === recommendedRoute?.id;
            const isFast = r.isFastest;
            const isSelected = r.id === selectedRoute?.id;
            const t = getRouteTime(r);
            const d = Number(r.distanceKm ?? r.distance ?? 0);
            const aqi = Number(r.avgAqi ?? r.aqi ?? 50);
            const score = Number(r.healthScore ?? r.score ?? 85);

            return (
              <div
                key={r.id || idx}
                onClick={() => handleSelect(r.id)}
                className={`relative rounded-3xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-white border-2 border-[#15803d] shadow-lift ring-4 ring-[#86efac]/30 scale-[1.01]'
                    : isRec
                    ? 'bg-emerald-50/40 border-[#a7f3d0] hover:border-[#15803d]/60 hover:shadow-soft'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-soft'
                }`}
              >
                {/* Selection Tag */}
                {isSelected && (
                  <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-[#15803d] text-white text-[11px] font-bold shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    ACTIVE SELECTION
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {isRec && (
                          <Badge variant="mint" size="sm" icon="eco">
                            Cleanest
                          </Badge>
                        )}
                        {isFast && (
                          <Badge variant="outline" size="sm" icon="speed">
                            Fastest
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                        {r.label || r.name || `Corridor ${idx + 1}`}
                      </h3>
                    </div>

                    <AqiBadge aqi={aqi} size="sm" />
                  </div>

                  {/* High-level stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-3 text-center">
                    <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-200/50">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Time</span>
                      <span className="font-mono text-base font-extrabold text-slate-900">{t}m</span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-200/50">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Distance</span>
                      <span className="font-mono text-base font-extrabold text-slate-900">{d} km</span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-200/50">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Health</span>
                      <span className="font-mono text-base font-extrabold text-[#15803d]">{score}</span>
                    </div>
                  </div>

                  {/* Exposure Bar */}
                  <div className="space-y-2 text-xs pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-medium">Air Quality Severity</span>
                        <span className="font-mono font-bold text-slate-700">{getAqiCategory(aqi)} (AQI {aqi})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(aqi, 200) : '0%',
                            backgroundColor: getAqiColor(aqi),
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-medium">Lung Protection Score</span>
                        <span className="font-mono font-bold text-[#15803d]">{score} / 100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#15803d] rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(score, 100) : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(r.id);
                    }}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#15803d] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon="navigation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(r.id);
                      if (onStartNavigation) onStartNavigation(r.id);
                    }}
                    className="h-9 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold"
                    title="Start navigating this corridor"
                  >
                    Go
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          DETAILED METRIC COMPARISON MATRIX TABLE
          ------------------------------------------------------------- */}
      <Card variant="default" p="none" className="overflow-hidden border-slate-200/90 shadow-soft rounded-3xl">
        <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Detailed Metric Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparison across atmospheric telemetry, travel efficiency, and respiratory impact.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Green pill = Optimal corridor value
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white text-xs font-mono uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6 font-bold w-1/4">Environmental Metric</th>
                {routes.map((r) => {
                  const isRec = r.id === recommendedRoute?.id;
                  const isSelected = r.id === selectedRoute?.id;
                  return (
                    <th
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/50 border-x border-[#86efac]/60' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 normal-case font-sans">
                          {r.label || r.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {isRec && <Badge variant="mint" size="sm">Recommended</Badge>}
                          {r.isFastest && <Badge variant="outline" size="sm">Fastest</Badge>}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {/* ROW 1: Average AQI Exposure */}
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#15803d] flex items-center justify-center border border-emerald-200/60">
                      <span className="material-symbols-outlined text-[18px]">air</span>
                    </span>
                    <div>
                      <span className="block font-bold">Average AQI Exposure</span>
                      <span className="text-[11px] text-slate-400 font-normal">Lower is cleaner</span>
                    </div>
                  </div>
                </td>
                {routes.map((r) => {
                  const aqi = Number(r.avgAqi ?? r.aqi ?? 50);
                  const isBest = aqi === minAqi;
                  const isSelected = r.id === selectedRoute?.id;
                  const color = getAqiColor(aqi);
                  return (
                    <td
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/30 border-x border-[#86efac]/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <AqiBadge aqi={aqi} size="sm" />
                        {isBest && <Badge variant="mint" size="sm">Cleanest</Badge>}
                      </div>
                      <div className="w-28 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(aqi, 200) : '0%',
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* ROW 2: Travel Duration */}
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                    </span>
                    <div>
                      <span className="block font-bold">Travel Duration</span>
                      <span className="text-[11px] text-slate-400 font-normal">Estimated trip time</span>
                    </div>
                  </div>
                </td>
                {routes.map((r) => {
                  const t = getRouteTime(r);
                  const isBest = t === minTime;
                  const isSelected = r.id === selectedRoute?.id;
                  return (
                    <td
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/30 border-x border-[#86efac]/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 font-mono">
                        <span className="font-extrabold text-slate-900 text-base">{t} min</span>
                        {isBest && <Badge variant="mint" size="sm">Fastest</Badge>}
                      </div>
                      <div className="w-28 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-slate-700 rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(t, 60) : '0%',
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* ROW 3: Distance */}
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                      <span className="material-symbols-outlined text-[18px]">straighten</span>
                    </span>
                    <div>
                      <span className="block font-bold">Total Distance</span>
                      <span className="text-[11px] text-slate-400 font-normal">Total route length</span>
                    </div>
                  </div>
                </td>
                {routes.map((r) => {
                  const d = Number(r.distanceKm ?? r.distance ?? 0);
                  const isBest = d === minDist;
                  const isSelected = r.id === selectedRoute?.id;
                  return (
                    <td
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/30 border-x border-[#86efac]/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 font-mono">
                        <span className="font-extrabold text-slate-900 text-base">{d} km</span>
                        {isBest && <Badge variant="mint" size="sm">Shortest</Badge>}
                      </div>
                      <div className="w-28 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-slate-500 rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(d, 10) : '0%',
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* ROW 4: Lung Health Score */}
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#15803d] flex items-center justify-center border border-emerald-200/60">
                      <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                    </span>
                    <div>
                      <span className="block font-bold">Lung Health Score</span>
                      <span className="text-[11px] text-slate-400 font-normal">0-100 respiratory index</span>
                    </div>
                  </div>
                </td>
                {routes.map((r) => {
                  const score = Number(r.healthScore ?? r.score ?? 85);
                  const isBest = score === maxScore;
                  const isSelected = r.id === selectedRoute?.id;
                  return (
                    <td
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/30 border-x border-[#86efac]/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 font-mono">
                        <span className="font-extrabold text-slate-900 text-base">{score} / 100</span>
                        {isBest && <Badge variant="mint" size="sm">Optimal</Badge>}
                      </div>
                      <div className="w-28 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-[#15803d] rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? getBarWidth(score, 100) : '0%',
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* ROW 5: Traffic Congestion Level */}
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                      <span className="material-symbols-outlined text-[18px]">traffic</span>
                    </span>
                    <div>
                      <span className="block font-bold">Traffic Congestion</span>
                      <span className="text-[11px] text-slate-400 font-normal">Vehicular exhaust intensity</span>
                    </div>
                  </div>
                </td>
                {routes.map((r) => {
                  const isSelected = r.id === selectedRoute?.id;
                  const traffic = r.trafficLevel || (r.isFastest ? 'High traffic' : r.isRecommended ? 'Low traffic' : 'Moderate traffic');
                  const isLow = traffic.toLowerCase().includes('low');
                  return (
                    <td
                      key={r.id}
                      className={`py-4 px-6 text-center ${
                        isSelected ? 'bg-emerald-50/30 border-x border-[#86efac]/40' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isLow
                            ? 'bg-emerald-100/70 text-[#15803d]'
                            : traffic.toLowerCase().includes('moderate')
                            ? 'bg-amber-100/70 text-amber-800'
                            : 'bg-red-100/70 text-red-700'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {traffic}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* -------------------------------------------------------------
          STICKY BOTTOM BAR: SELECTION CONFIRMATION & NAVIGATION
          ------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lift py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xs text-slate-400 uppercase font-mono font-bold hidden sm:inline">Active Choice:</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {selectedRoute?.label || recommendedRoute?.label}
            </span>
            {selectedRoute && (
              <AqiBadge aqi={selectedRoute.avgAqi} size="sm" />
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              icon="arrow_back"
              onClick={onBackToMap}
              className="hidden sm:inline-flex bg-white hover:bg-slate-50"
            >
              Back to map
            </Button>
            <Button
              variant="primary"
              size="md"
              icon="navigation"
              iconPosition="right"
              onClick={() =>
                onStartNavigation &&
                onStartNavigation(selectedRoute?.id || recommendedRoute?.id)
              }
              className="bg-[#16a34a] hover:bg-[#15803d] text-white font-black shadow-md px-5"
            >
              Start navigation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
