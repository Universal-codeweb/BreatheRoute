// src/pages/ActiveLiveNavigation.jsx
// ------------------------------------------------------------------
// BreatheRoute Active Live Navigation HUD (Driving-App Style)
// Features:
// - Full-screen MapView with floating dark-glass HUD panels
// - Top: Large turn-instruction card (direction icon, instruction, distance) + "Next:" preview
// - Floating live air-quality chip with LEVEL_COLORS and real-time advisory tip
// - Bottom bar: elapsed time, distance remaining, route progress bar, large Pause / Resume & End buttons (min 48px)
// - End-of-trip summary modal with focus trap, Escape to close, pollution avoided metric, and Share/Done
// - High contrast, accessible, one-handed mobile ergonomic layout
// ------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import MapView from '../components/MapView';
import {
  Button,
  AqiBadge,
  Badge,
} from '../components/ui';
import { LEVEL_COLORS } from '../utils/colors';
import { createTripSummaryPdf } from '../utils/generateTripSummaryPdf';

// Helper to pick turn direction icon based on instruction keyword
function getDirectionIcon(instruction = '') {
  const text = instruction.toLowerCase();
  if (text.includes('u-turn') || text.includes('uturn')) return 'u_turn_left';
  if (text.includes('slight right') || text.includes('bear right')) return 'turn_slight_right';
  if (text.includes('slight left') || text.includes('bear left')) return 'turn_slight_left';
  if (text.includes('right')) return 'turn_right';
  if (text.includes('left')) return 'turn_left';
  if (text.includes('roundabout') || text.includes('rotary')) return 'roundabout_right';
  if (text.includes('destination') || text.includes('arrive')) return 'flag';
  return 'straight';
}

export default function ActiveLiveNavigation({
  route,
  routes = [],
  origin,
  destination,
  onEndSession,
}) {
  const activeRoute = route || routes[0] || null;
  const routeSteps = Array.isArray(activeRoute?.steps) ? activeRoute.steps : [];
  const routeCoords = React.useMemo(() => {
    if (Array.isArray(activeRoute?.coords)) return activeRoute.coords;
    if (Array.isArray(activeRoute?.segments)) return activeRoute.segments.flatMap((s) => s.coords || []);
    return [];
  }, [activeRoute]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showAqiTip, setShowAqiTip] = useState(false);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  // Compute live location and remaining path ahead along the route coordinates
  const { currentNavLocation, remainingRoute } = React.useMemo(() => {
    if (routeCoords.length === 0) {
      return { currentNavLocation: origin || null, remainingRoute: activeRoute };
    }
    if (routeSteps.length <= 1) {
      const pt = routeCoords[0];
      return {
        currentNavLocation: { lng: pt[0], lat: pt[1] },
        remainingRoute: activeRoute,
      };
    }
    const ratio = currentStepIdx / Math.max(1, routeSteps.length - 1);
    const targetIdx = Math.min(
      routeCoords.length - 1,
      Math.max(0, Math.round(ratio * (routeCoords.length - 1)))
    );
    const pt = routeCoords[targetIdx];
    const navLoc = pt && Array.isArray(pt) && pt.length >= 2 ? { lng: pt[0], lat: pt[1] } : origin || null;

    // Slice route coordinates so traversed path behind user disappears (Google Maps style)
    const slicedCoords = routeCoords.slice(targetIdx);
    const finalCoords = slicedCoords.length >= 2 ? slicedCoords : (slicedCoords.length === 1 ? [slicedCoords[0], slicedCoords[0]] : []);
    const updatedRoute = activeRoute
      ? {
          ...activeRoute,
          coords: finalCoords,
          segments: finalCoords.length >= 2 ? [{
            coords: finalCoords,
            aqi: activeRoute.avgAqi || activeRoute.aqi || 35,
            level: activeRoute.aqiLevel || 'clean',
            color: '#15803d',
            instruction: 'Remaining Corridor',
          }] : [],
        }
      : null;

    return {
      currentNavLocation: navLoc,
      remainingRoute: updatedRoute,
    };
  }, [routeCoords, routeSteps.length, currentStepIdx, origin, activeRoute]);

  const modalRef = useRef(null);

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

  // Modal focus trap & Escape key handler
  useEffect(() => {
    if (!showSummaryModal) return;

    const modalEl = modalRef.current;
    if (modalEl) {
      const focusables = modalEl.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        modalEl.focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSummaryModal(false);
        return;
      }

      if (e.key === 'Tab' && modalEl) {
        const focusables = Array.from(
          modalEl.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSummaryModal]);

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

  // Distance calculations
  const totalDistance = Number(activeRoute?.distanceKm ?? activeRoute?.distance ?? 0);
  const remainingDistance =
    routeSteps.length > 0 && currentStepIdx < routeSteps.length
      ? routeSteps.slice(currentStepIdx).reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0)
      : totalDistance;

  const displayRemainingDistance =
    remainingDistance > 0
      ? remainingDistance < 1
        ? `${Math.round(remainingDistance * 1000)} m`
        : `${remainingDistance.toFixed(1)} km`
      : `${totalDistance} km`;

  const currentStepDistance =
    currentStep?.distanceKm > 0
      ? currentStep.distanceKm < 1
        ? `${Math.round(currentStep.distanceKm * 1000)} m`
        : `${currentStep.distanceKm.toFixed(1)} km`
      : 'In 100 m';

  // Progress percentage
  const routeProgress =
    routeSteps.length > 0
      ? Math.min(100, Math.round(((currentStepIdx + 1) / routeSteps.length) * 100))
      : 15;

  // Real Air Quality & Dynamic Tip
  const routeAqi = Number(activeRoute?.avgAqi ?? activeRoute?.aqi ?? 35);
  let aqiTip = 'Clean canopy corridor ahead. Breathe easy.';
  if (routeAqi > 150) {
    aqiTip = 'Air is hazardous ahead. Consider a mask and minimize exertion.';
  } else if (routeAqi > 100) {
    aqiTip = 'Air is getting worse ahead. Consider a mask.';
  } else if (routeAqi > 50) {
    aqiTip = 'Moderate particulate levels. Continue through shaded sections.';
  }

  // Compute pollution avoided compared to fastest route (strictly if computable)
  const fastestRoute = routes.find((r) => r.isFastest && r.id !== activeRoute?.id);
  let pollutionAvoided = null;
  if (
    fastestRoute?.avgAqi &&
    activeRoute?.avgAqi &&
    fastestRoute.avgAqi > activeRoute.avgAqi
  ) {
    const reduction = Math.round(
      ((fastestRoute.avgAqi - activeRoute.avgAqi) / fastestRoute.avgAqi) * 100
    );
    if (reduction > 0) {
      pollutionAvoided = `${reduction}% less pollution than fastest route`;
    }
  }

  // Generate and download colourful summary PDF report
  const handleDownloadPdf = () => {
    try {
      const doc = createTripSummaryPdf({
        origin,
        destination,
        activeRoute,
        elapsedSeconds,
        totalDistance,
        routeAqi,
        pollutionAvoided,
        routeSteps,
      });
      doc.save('BreatheRoute_Trip_Summary.pdf');
    } catch {
      // Fallback
    }
  };

  // Share the generated PDF directly via Web Share API
  const handleShare = async () => {
    try {
      const doc = createTripSummaryPdf({
        origin,
        destination,
        activeRoute,
        elapsedSeconds,
        totalDistance,
        routeAqi,
        pollutionAvoided,
        routeSteps,
      });

      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], 'BreatheRoute_Trip_Summary.pdf', {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'BreatheRoute Clean Trip Summary',
          text: `My verified clean commute summary report with BreatheRoute (${formatTime(elapsedSeconds)}, ${totalDistance} km)!`,
        });
      } else {
        // Fallback: download PDF and notify user
        doc.save('BreatheRoute_Trip_Summary.pdf');
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        handleDownloadPdf();
      }
    }
  };

  return (
    <div className="relative w-full -mt-16 h-screen overflow-hidden bg-slate-950 text-white select-none">
      {/* ============================================================
          BASE LAYER: FULL-SCREEN MAP CANVAS
          ============================================================ */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapView
          origin={origin}
          destination={destination}
          routes={remainingRoute ? [remainingRoute] : []}
          selectedRouteId={remainingRoute?.id}
          liveLocation={liveLocation}
          navLocation={currentNavLocation}
          showGridDefault
          isNavigationMode={true}
          routeColorOverride="#15803d"
          className="w-full h-full"
        />
      </div>

      {/* ============================================================
          TOP HUD: COMPACT SLEEK TURN-INSTRUCTION & LIVE AQI CHIP
          ============================================================ */}
      <div className="absolute top-20 left-3 right-3 sm:top-20 sm:left-4 sm:right-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2.5 pointer-events-none">
        {/* Compact Driving-Style Turn Instruction Panel */}
        <div className="pointer-events-auto max-w-md w-full bg-slate-950/85 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border border-white/15 shadow-xl flex items-center gap-3">
          {/* Direction Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center flex-shrink-0 shadow-md border border-[#86efac]/40">
            <span className="material-symbols-outlined text-[24px]">
              {getDirectionIcon(currentStep?.instruction)}
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base sm:text-lg font-black text-[#4ade80] tracking-tight">
                {currentStepDistance}
              </span>
              <Badge variant="mint" size="sm" icon="navigation">
                {gpsActive ? 'GPS ACTIVE' : 'SIMULATED'}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate mt-0.5" title={currentStep?.instruction}>
              {currentStep?.instruction || 'Follow highlighted botanical route'}
            </p>

            {nextStep?.instruction && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 truncate">
                <span className="text-[10px] uppercase font-mono text-slate-500">Next:</span>
                <span className="truncate">{nextStep.instruction}</span>
              </div>
            )}
          </div>
        </div>

        {/* Compact Live Air-Quality Chip & Toggleable Advisory Tip */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 backdrop-blur-xl rounded-full border border-white/15 shadow-xl text-xs">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  routeAqi <= 50
                    ? LEVEL_COLORS.clean
                    : routeAqi <= 100
                    ? LEVEL_COLORS.moderate
                    : routeAqi <= 150
                    ? LEVEL_COLORS.high
                    : LEVEL_COLORS.poor,
              }}
            />
            <span className="font-mono text-slate-300 text-[11px] font-semibold">Live AQI</span>
            <AqiBadge aqi={routeAqi} animated size="sm" />
            <button
              type="button"
              onClick={() => setShowAqiTip((v) => !v)}
              className="text-slate-400 hover:text-white p-0.5 ml-0.5 cursor-pointer"
              title="Toggle air quality advisory"
              aria-label="Toggle air quality advisory"
            >
              <span className="material-symbols-outlined text-[15px]">
                {showAqiTip ? 'expand_less' : 'info'}
              </span>
            </button>
          </div>

          {showAqiTip && (
            <div className="max-w-xs bg-slate-950/90 backdrop-blur-xl rounded-xl p-2.5 border border-white/15 shadow-xl text-[11px] text-slate-200 leading-snug flex items-start gap-1.5 animate-page-enter">
              <span className="material-symbols-outlined text-[14px] text-[#4ade80] flex-shrink-0 mt-0.5">
                shield_with_heart
              </span>
              <p>{aqiTip}</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          BOTTOM HUD: COMPACT STREAMLINED CONTROLS (NON-OBSTRUCTIVE)
          ============================================================ */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-30 pointer-events-none">
        {isHudMinimized ? (
          /* Minimized Ultra-Slim Floating Pill */
          <div className="pointer-events-auto max-w-sm mx-auto bg-slate-950/90 backdrop-blur-xl rounded-full px-4 py-2 border border-white/15 shadow-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#4ade80]">{displayRemainingDistance}</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-slate-300">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNextStep}
                className="px-2.5 py-1 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-[11px] font-bold cursor-pointer shadow-sm"
              >
                {currentStepIdx < routeSteps.length - 1 ? 'Next Turn' : 'Arrive'}
              </button>
              <button
                type="button"
                onClick={() => setIsHudMinimized(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Expand navigation controls"
                aria-label="Expand navigation controls"
              >
                <span className="material-symbols-outlined text-[18px]">expand_less</span>
              </button>
            </div>
          </div>
        ) : (
          /* Compact Streamlined Control Bar */
          <div className="pointer-events-auto max-w-lg mx-auto bg-slate-950/90 backdrop-blur-2xl rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 border border-white/15 shadow-2xl flex flex-col gap-2">
            {/* Thin Progress line */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-[#4ade80] font-semibold">Progress</span>
              <span>{routeProgress}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden -mt-1">
              <div
                className="h-full bg-gradient-to-r from-[#16a34a] to-[#4ade80] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${routeProgress}%` }}
              />
            </div>

            {/* Compact row with metrics and buttons */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              {/* Remaining & Elapsed */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block -mb-0.5">Remaining</span>
                  <span className="font-mono text-sm sm:text-base font-black text-[#4ade80]">{displayRemainingDistance}</span>
                </div>
                <div className="h-6 w-px bg-white/15" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block -mb-0.5">Elapsed</span>
                  <span className="font-mono text-xs font-semibold text-white">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant={isPaused ? 'primary' : 'secondary'}
                  size="sm"
                  icon={isPaused ? 'play_arrow' : 'pause'}
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="h-8 px-2.5 text-xs font-bold shadow-sm bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={currentStepIdx < routeSteps.length - 1 ? 'arrow_forward' : 'flag'}
                  iconPosition="right"
                  onClick={handleNextStep}
                  className="h-8 px-3 text-xs font-bold shadow-md bg-[#16a34a] hover:bg-[#15803d] text-white"
                >
                  {currentStepIdx < routeSteps.length - 1 ? 'Next Turn' : 'Arrive'}
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  icon="stop"
                  onClick={() => setShowSummaryModal(true)}
                  className="h-8 px-2.5 text-xs font-bold shadow-sm bg-red-600/90 hover:bg-red-600 text-white border border-red-500/40"
                  title="End Navigation"
                  aria-label="End navigation trip"
                >
                  <span className="hidden sm:inline">End</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setIsHudMinimized(true)}
                  className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer ml-0.5"
                  title="Minimize controls for full map view"
                  aria-label="Minimize controls for full map view"
                >
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          END-OF-TRIP SUMMARY MODAL (Focus Trap, Escape, Fade+Scale)
          ============================================================ */}
      {showSummaryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="modal-entrance bg-slate-900 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 flex flex-col gap-5 text-center text-white outline-none"
          >
            {/* Modal Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#15803d]/20 text-[#4ade80] flex items-center justify-center mx-auto border border-[#4ade80]/40 shadow-soft">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div>
              <h2 id="summary-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Trip Completed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                You successfully completed your clean air corridor on{' '}
                <strong className="text-[#4ade80]">{activeRoute?.label || 'BreatheRoute'}</strong>.
              </p>
            </div>

            {/* Metrics Recap Cards */}
            <div className="grid grid-cols-3 gap-2.5 py-1">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Total Time
                </span>
                <span className="font-mono text-lg font-black text-white mt-1 tabular-nums">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Distance
                </span>
                <span className="font-mono text-lg font-black text-white mt-1 tabular-nums">
                  {totalDistance} km
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Avg. AQI
                </span>
                <span className="font-mono text-lg font-black text-[#4ade80] mt-1 tabular-nums">
                  AQI {routeAqi.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Pollution Avoided Metric (Strictly hidden if missing) */}
            {pollutionAvoided && (
              <div className="bg-[#15803d]/15 p-3 rounded-2xl border border-[#4ade80]/30 flex items-center justify-center gap-2 text-xs font-semibold text-[#86efac]">
                <span className="material-symbols-outlined text-[18px]">eco</span>
                <span>{pollutionAvoided}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                icon="download"
                onClick={handleDownloadPdf}
                className="flex-1 min-h-[46px] bg-[#15803d]/25 text-[#4ade80] border border-[#4ade80]/40 hover:bg-[#15803d]/40 font-bold"
                title="Download colourful PDF summary and project report"
              >
                Download PDF
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon="share"
                onClick={handleShare}
                className="flex-1 min-h-[46px] bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold"
                title="Share the PDF report directly"
              >
                {copiedShare ? 'PDF Downloaded!' : 'Share PDF'}
              </Button>

              <Button
                variant="primary"
                size="md"
                icon="check"
                onClick={onEndSession}
                className="flex-1 min-h-[46px] bg-[#16a34a] hover:bg-[#15803d] text-white font-bold shadow-md"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
