// src/pages/ActiveLiveNavigation.jsx
// ------------------------------------------------------------------
// Active Live Navigation page.
// Removed all fake data (MOCK_NAVIGATION_STEPS, fake heart-rate, fake
// rerouting intervals, fake SVG map).
// Connects to the real selected route and origin/destination props.
// MapView integration will be added in Phase 3.
// ------------------------------------------------------------------

import React, { useState } from 'react';
import { LEVEL_COLORS } from '../utils/colors';

function levelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function ActiveLiveNavigation({
  route,
  routes = [],
  origin,
  destination,
  onEndSession,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // If no route is selected, pick the first route or fallback
  const activeRoute = route || routes[0] || null;

  // Real segments from the active route if available
  const steps = activeRoute?.segments && activeRoute.segments.length > 0
    ? activeRoute.segments
    : null;

  const currentStep = steps ? steps[currentStepIdx] : null;

  const handleNextStep = () => {
    if (steps && currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (steps && currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-surface select-none flex flex-col">
      {/* Top Navigation HUD */}
      <div className="z-10 bg-surface/90 backdrop-blur-md border-b border-surface-container px-margin md:px-margin-tablet py-space-sm flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-space-md">
          <button
            onClick={onEndSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Exit Navigation
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {activeRoute?.name || 'Active Navigation'}
              </h1>
              {activeRoute && (
                <span
                  className="font-data-badge text-data-badge font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${levelColor(activeRoute.aqiLevel)}20`,
                    color: levelColor(activeRoute.aqiLevel),
                  }}
                >
                  AQI {activeRoute.aqi} • {activeRoute.aqiLevel?.toUpperCase()}
                </span>
              )}
            </div>
            {origin && destination && (
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <span>{origin.label}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                <span>{destination.label}</span>
              </p>
            )}
          </div>
        </div>

        {/* Live HUD Stats */}
        {activeRoute && (
          <div className="hidden sm:flex items-center gap-space-lg">
            <div className="text-right">
              <span className="block font-data-badge text-data-badge text-on-surface-variant">Est. Time</span>
              <span className="font-title-lg text-title-lg font-bold text-on-surface">
                {activeRoute.time} min
              </span>
            </div>
            <div className="text-right">
              <span className="block font-data-badge text-data-badge text-on-surface-variant">Distance</span>
              <span className="font-title-lg text-title-lg font-bold text-on-surface">
                {activeRoute.distance} km
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area / Map Canvas */}
      <div className="flex-1 relative bg-surface-container-low flex flex-col md:flex-row overflow-hidden">
        {/* Map View Area (MapView connected in Phase 3) */}
        <div className="flex-1 relative flex items-center justify-center p-space-lg bg-surface-container-highest/40">
          <div className="text-center max-w-md p-space-xl bg-surface/80 backdrop-blur-sm rounded-2xl border border-surface-container shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-primary mb-space-sm block">
              navigation
            </span>
            <h2 className="font-title-lg text-title-lg font-bold text-on-surface mb-space-xs">
              Live Route Navigation
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
              Interactive map with real-time GPS tracking and clean air corridor view will appear here.
            </p>
            {activeRoute?.reason && (
              <div className="p-space-sm bg-secondary-container/40 text-on-secondary-container rounded-lg font-body-sm text-body-sm">
                {activeRoute.reason}
              </div>
            )}
          </div>
        </div>

        {/* Step-by-step Turn / Segment Guidance Panel */}
        <div className="w-full md:w-96 bg-surface border-t md:border-t-0 md:border-l border-surface-container p-space-md flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Route Details
              </h3>
              <span className="font-data-badge text-data-badge px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>

            {steps && steps.length > 0 ? (
              <div className="space-y-space-sm">
                <div className="p-space-md rounded-xl bg-primary text-on-primary">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-data-badge text-data-badge text-on-primary/80">
                      Step {currentStepIdx + 1} of {steps.length}
                    </span>
                    {currentStep?.aqi && (
                      <span className="font-data-badge text-data-badge px-1.5 py-0.5 rounded bg-white/20">
                        AQI {currentStep.aqi}
                      </span>
                    )}
                  </div>
                  <p className="font-title-md text-title-md font-semibold">
                    {currentStep?.instruction || currentStep?.name || `Segment ${currentStepIdx + 1}`}
                  </p>
                  {currentStep?.distance && (
                    <p className="font-body-sm text-body-sm text-on-primary/80 mt-1">
                      {currentStep.distance}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-space-sm">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIdx === 0}
                    className="flex-1 py-2 rounded-lg border border-surface-container text-on-surface font-label-md text-label-md disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={currentStepIdx === steps.length - 1}
                    className="flex-1 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md disabled:opacity-40"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-space-md rounded-xl bg-surface-container text-on-surface-variant text-center font-body-sm text-body-sm">
                Full turn-by-turn navigation instructions will appear when step segments are returned by the routing engine.
              </div>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-space-md border-t border-surface-container mt-space-md flex items-center gap-space-sm">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex-1 py-2.5 rounded-xl border border-outline/30 text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onEndSession}
              className="flex-1 py-2.5 rounded-xl bg-error text-on-error font-label-md text-label-md font-semibold hover:bg-error/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
