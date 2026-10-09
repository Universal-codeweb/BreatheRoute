// src/pages/RoutePlanning.jsx
// ------------------------------------------------------------------
// 4-step route planning wizard. All fake data removed.
// Step 1: Origin & Destination  |  Step 2: Mode (Walk / Cycle)
// Step 3: Health Profile         |  Step 4: Preview real routes
// ------------------------------------------------------------------

import React, { useState } from 'react';
import { LEVEL_COLORS } from '../utils/colors';

function levelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function RoutePlanning({
  origin,
  setOrigin,
  destination,
  setDestination,
  mode,
  setMode,
  profile,
  setProfile,
  loading,
  error,
  routes,
  onFindRoutes,
  onProceedToMap,
  onProceedToComparison,
  onStartNavigation,
}) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Health profile options
  const profileOptions = [
    { id: 'general', icon: '🧍', title: 'General',  desc: 'Balance travel time and air quality equally.' },
    { id: 'asthma',  icon: '🫁', title: 'Asthma',   desc: 'Strongly avoid high PM2.5 and PM10 segments.' },
    { id: 'elderly', icon: '❤️', title: 'Elderly',   desc: 'Prefer cleaner, quieter routes with less traffic.' },
    { id: 'child',   icon: '👶', title: 'Child',     desc: 'Maximise distance from heavy vehicle corridors.' },
  ];

  // Step definitions for the stepper bar
  const steps = [
    { step: 1, title: 'Destination', icon: 'pin_drop' },
    { step: 2, title: 'Travel mode', icon: 'directions_walk' },
    { step: 3, title: 'Health profile', icon: 'cardiology' },
    { step: 4, title: 'Preview',     icon: 'insights' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">

      {/* Page Header */}
      <div className="flex items-center gap-space-sm mb-space-lg">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          aria-label="Go to previous step"
          className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Step {currentStep} of 4
          </p>
          <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
            Plan your route
          </h1>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm mb-space-xl">
        {steps.map((item) => {
          const done = currentStep > item.step;
          const active = currentStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className={`flex items-center gap-space-sm p-space-sm rounded-xl transition-all border ${
                active
                  ? 'bg-primary-container border-primary-container text-on-primary-container shadow-sm'
                  : done
                    ? 'bg-secondary-container/40 border-secondary-container/40 text-on-secondary-container'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {done ? 'check_circle' : item.icon}
              </span>
              <span className="font-label-md text-label-md font-semibold">{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-space-lg md:p-space-xl shadow-sm border border-white min-h-[400px]">

        {/* ========== STEP 1: Origin & Destination ========== */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-space-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Where are you going?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Set your start and end points. Place search will be available once the map is connected.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md max-w-3xl">
              {/* Origin display */}
              <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container">
                <div className="flex items-center gap-space-xs mb-space-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Origin</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">
                  {origin ? origin.label : 'Not selected yet'}
                </p>
              </div>

              {/* Destination display */}
              <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container">
                <div className="flex items-center gap-space-xs mb-space-xs">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Destination</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">
                  {destination ? destination.label : 'Not selected yet'}
                </p>
              </div>
            </div>

            {!origin || !destination ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-space-md rounded-xl">
                <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">info</span>
                Place search and "pick on map" will be available in a coming update.
                For now, both points will be set when the map component is ready.
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 2: Travel Mode ========== */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-space-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              How will you travel?
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              The routing engine adjusts air exposure calculations based on your travel mode.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg max-w-3xl">
              {/* Walking */}
              <button
                onClick={() => setMode('walking')}
                className={`cursor-pointer text-left rounded-2xl p-space-lg shadow-sm transition-all border-2 ${
                  mode === 'walking'
                    ? 'border-secondary bg-secondary-container/30'
                    : 'border-surface-container bg-surface-container-low hover:border-outline-variant'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">directions_walk</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">Walking</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Pedestrian-friendly paths with cleaner air and sidewalks.
                </p>
              </button>

              {/* Cycling */}
              <button
                onClick={() => setMode('cycling')}
                className={`cursor-pointer text-left rounded-2xl p-space-lg shadow-sm transition-all border-2 ${
                  mode === 'cycling'
                    ? 'border-secondary bg-secondary-container/30'
                    : 'border-surface-container bg-surface-container-low hover:border-outline-variant'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[28px]">pedal_bike</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">Cycling</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Bike-friendly roads prioritising lower-traffic corridors.
                </p>
              </button>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-opacity"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 3: Health Profile ========== */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-space-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Select your health profile
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              This helps the engine weigh air quality more or less heavily when scoring routes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {profileOptions.map((card) => {
                const selected = profile === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setProfile(card.id)}
                    className={`cursor-pointer text-left rounded-2xl p-space-md transition-all border-2 ${
                      selected
                        ? 'border-secondary bg-secondary-container/30 shadow-md'
                        : 'border-surface-container bg-surface-container-low hover:border-outline-variant'
                    }`}
                  >
                    <span className="text-2xl block mb-space-sm">{card.icon}</span>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold mb-1">
                      {card.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {card.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
              <button
                onClick={() => { onFindRoutes(); handleNext(); }}
                disabled={!origin || !destination}
                className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Find routes
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 4: Preview ========== */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-space-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Route preview
            </h2>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-space-sm p-space-md bg-secondary-container/30 rounded-xl font-body-sm text-body-sm text-on-secondary-container">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Finding the best routes for you…
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="p-space-md bg-error-container text-on-error-container rounded-xl flex items-center gap-space-sm font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
                <button
                  onClick={onFindRoutes}
                  className="ml-auto px-space-md py-space-xs rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Routes list */}
            {!loading && !error && routes.length > 0 && (
              <div className="space-y-space-md">
                {routes.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md rounded-xl border border-surface-container gap-space-sm"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: levelColor(r.aqiLevel) }}
                      />
                      <div>
                        <p className="font-label-lg text-label-lg text-on-surface font-bold">
                          {r.name}
                          {r.isRecommended && (
                            <span className="ml-2 font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                              Recommended
                            </span>
                          )}
                          {r.isFastest && !r.isRecommended && (
                            <span className="ml-2 font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                              Fastest
                            </span>
                          )}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {r.time} min · {r.distance} km · AQI {r.aqi} ({r.aqiLevel}) · {r.traffic}
                        </p>
                        {r.reason && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            {r.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onStartNavigation(r.id)}
                      className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      Navigate
                    </button>
                  </div>
                ))}

                <div className="flex gap-space-sm pt-space-sm">
                  <button
                    onClick={onProceedToMap}
                    className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-secondary-container text-on-secondary-container font-label-lg text-label-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    Open on map
                  </button>
                  <button
                    onClick={onProceedToComparison}
                    className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">balance</span>
                    Compare routes
                  </button>
                </div>
              </div>
            )}

            {/* Empty state (no routes yet) */}
            {!loading && !error && routes.length === 0 && (
              <div className="text-center py-space-2xl">
                <span className="material-symbols-outlined text-[48px] text-outline-variant mb-space-md block">
                  route
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  No routes yet. Select an origin and destination, then click "Find routes".
                </p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Go to step 1
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
