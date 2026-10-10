// src/pages/ActiveLiveNavigation.jsx
// ------------------------------------------------------------------
// BreatheRoute Active Live Navigation HUD
// Aligned with Stitch active_live_navigation UI.
// ------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';

export default function ActiveLiveNavigation({
  route,
  routes = [],
  origin,
  destination,
  onEndSession,
}) {
  const activeRoute = route || routes[0] || null;
  const routeSteps = Array.isArray(activeRoute?.steps) ? activeRoute.steps : [];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const currentStep = routeSteps[currentStepIdx] || null;
  const nextStep = routeSteps[currentStepIdx + 1] || null;

  // Live GPS tracking
  const [liveLocation, setLiveLocation] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);

  // Elapsed timer
  useEffect(() => {
    if (isPaused || showSummaryModal) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, showSummaryModal]);

  // Geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsActive(true);
        setLiveLocation({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          heading: pos.coords.heading || 0,
          accuracy: pos.coords.accuracy || 10,
        });
      },
      () => {
        setGpsActive(false);
        setLiveLocation(null);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    if (currentStepIdx < routeSteps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setShowSummaryModal(true);
    }
  };

  const currentStepDistance = currentStep?.distanceKm > 0
    ? currentStep.distanceKm < 1
      ? `${Math.round(currentStep.distanceKm * 1000)} m`
      : `${currentStep.distanceKm.toFixed(1)} km`
    : '—';
  const routeAqi = Number(activeRoute?.avgAqi);
  const routeAqiLabel = Number.isFinite(routeAqi)
    ? routeAqi <= 50 ? 'Good' : routeAqi <= 100 ? 'Moderate' : routeAqi <= 150 ? 'High' : 'Poor'
    : 'Unavailable';

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[720px] overflow-hidden bg-surface">
      {/* Underlying MapView Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <MapView
          origin={origin}
          destination={destination}
          routes={activeRoute ? [activeRoute] : []}
          selectedRouteId={activeRoute?.id}
          liveLocation={liveLocation}
          showGridDefault
          className="w-full h-full"
        />
      </div>

      {/* FLOATING TOP HUD: ROUTE TELEMETRY PILL & GAUGES */}
      <div className="absolute top-space-md left-space-md right-space-md z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm pointer-events-none">
        {/* Left Telemetry Pill */}
        <div
          className="pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-2xl p-space-sm md:px-space-lg md:py-space-sm shadow-xl border border-[#86EFAC]/70 flex flex-wrap items-center justify-between gap-space-md transition-all"
          style={{
            boxShadow: 'rgba(15, 61, 42, 0.18) 0px 20px 45px -10px, rgba(0, 38, 23, 0.08) 0px 4px 12px',
          }}
        >
          <div className="flex items-center gap-space-sm">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[#15803D] flex-shrink-0 shadow-md border border-[#86EFAC]"
              style={{ background: 'linear-gradient(to bottom, #DCFCE7, #BBF7D0)' }}
            >
              <span className="material-symbols-outlined text-[24px]">forest</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-[18px] text-[#15803D] tracking-tight font-bold">
                  {activeRoute?.label || 'Selected route'}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${gpsActive ? 'bg-[#16A34A]' : 'bg-amber-500'}`} />
              </div>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-data-badge text-data-badge">
                <span className="font-medium">
                  {activeRoute?.distanceKm ?? '—'} km route distance
                </span>
                <span>•</span>
                <span className="text-[#15803D] font-semibold">
                  Elapsed: {formatTime(elapsedSeconds)}
                </span>
                <span>•</span>
                <span className="font-medium">
                  Est. {activeRoute?.durationMinutes ?? activeRoute?.time ?? '—'} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-sm bg-[#F0FDF4] py-1.5 px-space-md rounded-xl border border-[#BBF7D0]">
            <div className="flex items-center gap-space-xs px-2 py-0.5 rounded-lg bg-[#DCFCE7] border border-[#86EFAC]">
              <span className="material-symbols-outlined text-[18px] text-[#15803D]">my_location</span>
              <span className="font-data-badge text-[11px] text-[#14532D] font-bold">
                {gpsActive && liveLocation ? `GPS ±${Math.round(liveLocation.accuracy)} m` : 'GPS unavailable'}
              </span>
            </div>
            <div className="w-px h-6 bg-[#BBF7D0]" />
            <div className="flex items-center gap-space-xs px-2 py-0.5 rounded-lg bg-[#DCFCE7] border border-[#86EFAC]">
              <span className="material-symbols-outlined text-[18px] text-[#15803D]">air</span>
              <span className="font-data-badge text-[11px] text-[#14532D] font-bold">
                AQI est. {Number.isFinite(routeAqi) ? routeAqi.toFixed(0) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Microclimate Gauge */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-2xl px-space-md py-space-sm shadow-xl border border-[#86EFAC] flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="relative flex items-center justify-center p-1 rounded-full bg-[#DCFCE7]">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#BBF7D0]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-[#15803D]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="72, 100"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute font-data-metric text-[12px] font-extrabold text-[#14532D]">
                {Number.isFinite(routeAqi) ? routeAqi.toFixed(0) : '—'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-bold">
                  Route AQI estimate
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-data-badge text-[10px] font-bold border border-[#86EFAC]">
                  {routeAqiLabel.toUpperCase()}
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface font-medium">
                Experimental estimate; not a live sensor reading.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-LEFT FLOATING TURN-BY-TURN GUIDANCE CARD */}
      <div className="absolute bottom-space-md left-space-md right-space-md md:right-auto md:w-[480px] z-30 flex flex-col gap-space-sm pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-2xl p-space-md shadow-2xl border border-[#86EFAC]/70 flex flex-col gap-space-md">
          <div className="flex items-start gap-space-md">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md border border-[#86EFAC]/40"
              style={{ background: 'linear-gradient(to bottom, #15803D, #14532D)' }}
            >
              <span className="material-symbols-outlined text-[36px]">straight</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-space-xs">
                <span className="font-data-metric text-[28px] leading-tight font-extrabold text-[#15803D]">
                  {currentStepDistance}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-data-badge text-data-badge font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">eco</span>
                  {currentStep ? 'ROUTE STEP' : 'ROUTE OVERVIEW'}
                </span>
              </div>
              <h2
                className="text-[20px] leading-tight text-on-surface truncate font-semibold mt-0.5"
              >
                {currentStep?.instruction || 'Follow the highlighted route on the map'}
              </h2>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-[13px] mt-1">
                <span>Upcoming:</span>
                <span className="material-symbols-outlined text-[16px] text-[#15803D]">turn_right</span>
                <span className="truncate font-semibold text-[#15803D]">
                  {nextStep?.instruction || (routeSteps.length ? 'Final route step' : 'Turn guidance unavailable')}
                </span>
              </div>
            </div>
          </div>

          {/* Segment Cleanliness & Shade Profile */}
          <div className="bg-[#F0FDF4] rounded-xl p-space-sm flex flex-col gap-1.5 border border-[#86EFAC]/50">
            <div className="flex items-center justify-between text-on-surface-variant font-data-badge text-[10px] uppercase tracking-wider">
              <span className="font-bold text-[#14532D]">Estimated route conditions</span>
              <span className="text-[#15803D] font-bold">AQI {Number.isFinite(routeAqi) ? routeAqi.toFixed(0) : '—'} · {routeAqiLabel}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#BBF7D0]/60 overflow-hidden flex shadow-inner">
              <div className="h-full bg-[#15803D]" style={{ width: `${Number.isFinite(routeAqi) ? Math.max(4, Math.min(100, routeAqi / 2)) : 0}%` }} title="Estimated route AQI" />
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-data-badge text-[11px]">
              <span className="text-[#14532D] font-medium">AQI 0</span>
              <span className="text-[#15803D] font-semibold">AQI 100</span>
              <span className="text-[#14532D]">AQI 200+</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="bg-[#F0FDF4] rounded-xl p-space-sm flex flex-col justify-between border border-[#BBF7D0]">
              <div className="flex items-center gap-1 text-[#15803D]">
                <span className="material-symbols-outlined text-[16px]">shield</span>
                <span className="font-data-badge text-[10px] uppercase font-bold tracking-wider">
                  Route preference score
                </span>
              </div>
              <div className="mt-1">
                <span className="font-data-metric text-[24px] font-extrabold text-[#15803D]">{activeRoute?.score ?? '—'}/100</span>
                <p className="font-body-sm text-[11px] leading-tight text-on-surface-variant">
                  Experimental preference score
                </p>
              </div>
            </div>

            <div className="bg-[#F0FDF4] rounded-xl p-space-sm flex flex-col justify-between border border-[#BBF7D0]">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-error">favorite</span>
                <span className="font-data-badge text-[10px] uppercase font-bold tracking-wider text-[#14532D]">
                  Estimated duration
                </span>
              </div>
              <div className="mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-data-metric text-[24px] font-extrabold text-[#14532D]">{activeRoute?.durationMinutes ?? activeRoute?.time ?? '—'}</span>
                  <span className="font-data-badge text-[11px] text-on-surface-variant">min</span>
                </div>
                <p className="font-body-sm text-[11px] leading-tight text-[#15803D] font-medium">
                  Routing estimate
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-space-xs pt-1">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 h-12 rounded-xl bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-[#BBF7D0] transition-colors shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">{currentStepIdx < routeSteps.length - 1 ? 'arrow_forward' : 'flag'}</span>
              <span>{currentStepIdx < routeSteps.length - 1 ? 'Next step' : 'Finish route'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSummaryModal(true)}
              className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              title="End Trip"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* GPS and estimate status */}
        <div className="pointer-events-auto bg-[#14532D] text-white px-space-md py-space-sm rounded-xl shadow-lg flex items-center justify-between text-body-sm text-[13px] border border-[#86EFAC]/40">
          <span className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-[#86EFAC]">info</span>
            <span>{gpsActive ? 'GPS location is shown on the map.' : 'Allow location access to show your position.'} AQI and traffic values are estimates.</span>
          </span>
        </div>
      </div>

      {/* TRIP COMPLETION MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-3xl p-space-xl shadow-2xl border border-[#a7f3d0] flex flex-col gap-space-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center mx-auto border border-[#86efac]">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3
              className="text-[28px] font-bold text-primary"
            >
              Navigation session ended
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              You navigated for {formatTime(elapsedSeconds)} on {activeRoute?.label || 'the selected route'}. AQI and traffic scores are experimental estimates, not live measurements.
            </p>

            <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-[#f0fdf4] rounded-2xl border border-[#d1fae5]">
              <div>
                <span className="text-[11px] text-on-surface-variant font-data-badge uppercase block">Time Navigated</span>
                <span className="text-[20px] font-bold text-[#14532d] font-data-metric">{formatTime(elapsedSeconds)}</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant font-data-badge uppercase block">Route AQI estimate</span>
                <span className="text-[20px] font-bold text-[#15803d] font-data-metric">{Number.isFinite(routeAqi) ? routeAqi.toFixed(0) : '—'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onEndSession}
              className="w-full h-12 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white font-label-lg font-bold shadow-md cursor-pointer transition-all"
            >
              Return to Map Explorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
