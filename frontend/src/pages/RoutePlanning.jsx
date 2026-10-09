// src/pages/RoutePlanning.jsx
// ------------------------------------------------------------------
// 4-Step Route Planning Wizard with MapView and PlaceInput.
// Aligned with Stitch route_planning_preferences UI.
// ------------------------------------------------------------------

import React, { useState } from 'react';
import PlaceInput from '../components/PlaceInput';
import MapView from '../components/MapView';

export default function RoutePlanning({
  origin,
  setOrigin,
  destination,
  setDestination,
  mode,
  setMode,
  profile,
  setProfile,
  loading = false,
  error = null,
  routes = [],
  onFindRoutes,
  onProceedToMap,
  onProceedToComparison,
  onStartNavigation,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [pickMode, setPickMode] = useState(null); // 'origin' | 'destination' | null
  const [previewSelectedId, setPreviewSelectedId] = useState(null);

  const handleNext = () => {
    if (currentStep === 3) {
      onFindRoutes();
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const profileOptions = [
    {
      id: 'general',
      icon: '🧍',
      title: 'General Commuter',
      desc: 'Balance travel time, distance, traffic, and air quality equally.',
      badge: 'Balanced Inhalation',
    },
    {
      id: 'pollution',
      icon: '🌿',
      title: 'Pollution Sensitive',
      desc: 'Heavy weight toward clean tree canopies, low particulate, and greenways.',
      badge: 'Max Purity Filter',
    },
    {
      id: 'asthma',
      icon: '🫁',
      title: 'Asthma / Reactive',
      desc: 'Strictly penalises PM2.5, PM10 spikes, and stagnant vehicle exhaust canyons.',
      badge: 'Zero Spikes Priority',
    },
    {
      id: 'elderly',
      icon: '👶',
      title: 'Elderly & Child',
      desc: 'Prefers shaded green avenues, lower physical grade, and tranquil sidewalks.',
      badge: 'Gentle Elevation',
    },
  ];

  const steps = [
    { step: 1, title: 'Destination', subtitle: 'Waypoint & target', icon: 'pin_drop' },
    { step: 2, title: 'Travel Mode', subtitle: 'Walk vs Cycle', icon: 'directions_walk' },
    { step: 3, title: 'Health Filters', subtitle: 'Exposure priorities', icon: 'cardiology' },
    { step: 4, title: 'Telemetry Engine', subtitle: 'Synthesize routes', icon: 'insights' },
  ];

  const activeSelectedRoute =
    routes.find((r) => r.id === previewSelectedId) ||
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
      {/* Top Action Breadcrumb & Quick Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            aria-label="Go to previous step"
            className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
              <span>Route Optimiser</span>
              <span>•</span>
              <span className="text-secondary font-semibold">
                Step {currentStep}. {steps[currentStep - 1].title}
              </span>
            </div>
            <p
              className="text-[26px] md:text-[30px] font-bold text-primary tracking-tight leading-snug"
              style={{ fontFamily: 'Newsreader, Georgia, serif' }}
            >
              Plan Your <span className="italic font-semibold text-secondary">Healthy Journey</span>
            </p>
          </div>
        </div>

        {/* Live Sensor Telemetry Badge */}
        <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-2 rounded-2xl shadow-sm border border-[#a7f3d0]/40">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-data-badge text-data-badge text-on-surface-variant uppercase tracking-wider text-[11px]">
              Live Sensors:
            </span>
            <span className="font-data-badge text-data-badge font-semibold text-secondary tabular-nums text-[12px]">
              Micro-Sensor Array Active
            </span>
          </div>
          <div className="h-4 w-px bg-surface-container-highest" />
          <div className="flex items-center gap-space-xs font-data-badge text-data-badge text-on-surface-variant">
            <span className="text-[11px] uppercase tracking-wider">Model:</span>
            <span className="font-semibold text-primary tabular-nums text-[12px]">CPCB / EPA-AQI</span>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Track */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm mb-space-xl">
        {steps.map((s) => {
          const isCurrent = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`text-left p-space-md rounded-2xl transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? 'bg-surface-container-lowest shadow-md border-l-4 border-secondary text-primary ring-1 ring-[#a7f3d0]'
                  : isDone
                  ? 'bg-surface-container-low/90 text-primary hover:bg-surface-container'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-data-badge text-[11px] uppercase tracking-widest tabular-nums font-bold ${
                    isCurrent ? 'text-secondary' : 'text-on-surface-variant/70'
                  }`}
                >
                  Step 0{s.step}
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isCurrent || isDone ? 'text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  {isDone ? 'check_circle' : s.icon}
                </span>
              </div>
              <p className="font-label-lg text-label-lg font-bold tracking-tight text-on-surface">
                {s.title}
              </p>
              <p className="text-[12px] font-medium text-on-surface-variant/80 tracking-normal truncate mt-0.5">
                {s.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Wizard Core Container */}
      <div
        className="relative bg-surface-container-lowest rounded-3xl p-space-md md:p-space-xl shadow-xl overflow-hidden min-h-[580px] flex flex-col justify-between"
        style={{
          border: '1.5px solid rgb(220, 236, 226)',
          boxShadow: 'rgba(21, 128, 61, 0.08) 0px 10px 30px -5px',
        }}
      >
        {/* STEP 1: DESTINATION SEARCH */}
        {currentStep === 1 && (
          <section className="flex flex-col gap-space-lg">
            <div className="max-w-2xl">
              <span className="font-data-badge text-[11px] text-secondary uppercase tracking-[0.2em] font-bold">
                Spatial Targeting
              </span>
              <h2
                className="text-[36px] md:text-[44px] leading-[1.12] text-primary tracking-tight mt-1"
                style={{ fontFamily: 'Newsreader, Georgia, serif' }}
              >
                Where do you <span className="font-semibold italic text-secondary">want to wander?</span>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant/90 leading-relaxed mt-2">
                Set your corridor. We will cross-reference street canopy, vehicle emissions, and live dispersion models.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Inputs Column */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="bg-surface-container-low/70 p-space-md rounded-2xl border border-[#dcfce7] flex flex-col gap-space-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="font-label-md text-label-md font-bold text-[#14532d] uppercase tracking-wider">
                      Origin &amp; Waypoint Coordinates
                    </span>
                  </div>

                  <PlaceInput
                    label="Current Origin"
                    placeholder="Search start location or use GPS..."
                    value={origin}
                    onChange={setOrigin}
                    onPickOnMap={() => setPickMode('origin')}
                    isPicking={pickMode === 'origin'}
                  />

                  <PlaceInput
                    label="Target Destination"
                    placeholder="Search target destination..."
                    value={destination}
                    onChange={setDestination}
                    onPickOnMap={() => setPickMode('destination')}
                    isPicking={pickMode === 'destination'}
                  />

                  {error && (
                    <div className="text-error text-body-sm bg-error-container/40 p-2.5 rounded-xl border border-error/20 flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Canopy detection card */}
                <div className="p-space-md bg-[#ecfdf5] rounded-2xl flex items-start gap-space-sm border border-[#a7f3d0]">
                  <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">park</span>
                  <p className="font-body-sm text-[13px] text-on-surface leading-relaxed">
                    <span className="font-bold text-secondary tracking-tight">Canopy Detection Active:</span>{' '}
                    Paths along residential corridors and water bodies have up to <span className="font-semibold tabular-nums">48%</span> higher tree canopy density than main highways, yielding significantly reduced ambient particulate absorption.
                  </p>
                </div>
              </div>

              {/* Mini Map Column */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#a7f3d0] h-[320px]">
                  <MapView
                    origin={origin}
                    destination={destination}
                    onSelectLocation={(loc) => {
                      if (pickMode === 'origin') {
                        setOrigin(loc);
                        setPickMode(null);
                      } else if (pickMode === 'destination') {
                        setDestination(loc);
                        setPickMode(null);
                      }
                    }}
                    pickMode={pickMode}
                    className="w-full h-full"
                  />
                </div>

                {/* Microclimate Cards */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="p-space-sm rounded-2xl shadow-sm bg-[#f0fdf4] border border-[#a7f3d0]">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#15803d]">air</span>
                      <span className="font-data-badge text-[11px] uppercase tracking-wider font-bold text-[#166534]">
                        Wind Vector
                      </span>
                    </div>
                    <p className="font-data-metric text-[18px] font-bold mt-0.5 tabular-nums tracking-tight text-[#052e16]">
                      7.4 km/h SW
                    </p>
                    <p className="font-data-badge text-[11px] font-semibold text-[#15803d]">
                      Smog dispersion active
                    </p>
                  </div>

                  <div className="p-space-sm rounded-2xl shadow-sm bg-[#ecfdf5] border border-[#a7f3d0]">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-[#15803d]">thermostat</span>
                      <span className="font-data-badge text-[11px] uppercase tracking-wider font-bold text-[#166534]">
                        Microclimate
                      </span>
                    </div>
                    <p className="font-data-metric text-[18px] font-bold mt-0.5 tabular-nums tracking-tight text-[#052e16]">
                      28.2°C • 58% RH
                    </p>
                    <p className="font-data-badge text-[11px] font-semibold text-[#15803d]">
                      Clean thermal layer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: TRAVEL MODE */}
        {currentStep === 2 && (
          <section className="flex flex-col gap-space-lg">
            <div className="max-w-2xl">
              <span className="font-data-badge text-data-badge text-secondary uppercase tracking-widest font-semibold">
                Locomotion Model
              </span>
              <h2
                className="text-[34px] md:text-[40px] leading-[1.15] text-primary tracking-tight mt-1 font-bold"
                style={{ fontFamily: 'Newsreader, Georgia, serif' }}
              >
                How are you travelling?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Choose your locomotion mode. Inhalation ventilation rates and elevation penalties adapt according to respiratory physiology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg max-w-4xl pt-space-sm">
              {/* Walking Card */}
              <button
                type="button"
                onClick={() => setMode('walking')}
                className={`text-left cursor-pointer relative rounded-3xl p-space-lg shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                  mode === 'walking'
                    ? 'bg-[#ecfdf5] border-2 border-secondary shadow-lg'
                    : 'bg-surface-container-low border border-surface-container hover:bg-surface-container'
                }`}
              >
                {mode === 'walking' && (
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container mb-space-md">
                  <span className="material-symbols-outlined text-[36px]">directions_walk</span>
                </div>
                <div className="flex items-center gap-space-xs mb-1">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Walking</h3>
                  <span className="font-data-badge text-data-badge px-space-xs py-0.5 bg-secondary text-white rounded-full">
                    Default
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  Find pedestrian-friendly routes with cleaner air, tree shade canopies, sidewalks, and quiet low-traffic roads.
                </p>
                <div className="space-y-space-xs pt-space-xs border-t border-secondary-fixed/40">
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface-variant">Minute Ventilation:</span>
                    <span className="font-semibold text-primary">12.5 L/min average</span>
                  </div>
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface-variant">Corridor Criteria:</span>
                    <span className="font-semibold text-secondary">Sidewalks • Tree Shade • Low Tailpipe</span>
                  </div>
                </div>
              </button>

              {/* Cycling Card */}
              <button
                type="button"
                onClick={() => setMode('cycling')}
                className={`text-left cursor-pointer relative rounded-3xl p-space-lg shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                  mode === 'cycling'
                    ? 'bg-[#ecfdf5] border-2 border-secondary shadow-lg'
                    : 'bg-surface-container-low border border-surface-container hover:bg-surface-container'
                }`}
              >
                {mode === 'cycling' && (
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary mb-space-md">
                  <span className="material-symbols-outlined text-[36px]">directions_bike</span>
                </div>
                <div className="flex items-center gap-space-xs mb-1">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Cycling</h3>
                  <span className="font-data-badge text-data-badge px-space-xs py-0.5 bg-surface-container text-on-surface-variant rounded-full">
                    Aerobic Inhalation
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  Find cycling routes with lower vehicular soot, gentle gradients (&lt;4%), and reduced intersection idling.
                </p>
                <div className="space-y-space-xs pt-space-xs border-t border-surface-container-highest">
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface-variant">Minute Ventilation:</span>
                    <span className="font-semibold text-primary">38.0 L/min (3x inhalation)</span>
                  </div>
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="text-on-surface-variant">Corridor Criteria:</span>
                    <span className="font-semibold text-secondary">Bicycle Lanes • Low Gradient (&lt;4%)</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="max-w-4xl p-space-md bg-surface-container-low rounded-2xl flex items-center gap-space-md border border-[#a7f3d0]">
              <span className="material-symbols-outlined text-secondary text-[24px]">vital_signs</span>
              <div>
                <p className="font-label-lg text-label-lg font-semibold text-primary">Dynamic Lung Exposure Calculation</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Because cycling increases breath depth and inhalation volume by up to 250%, our routing engine penalizes high-particulate arterial segments proportionally higher.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3: HEALTH FILTERS */}
        {currentStep === 3 && (
          <section className="flex flex-col gap-space-lg">
            <div className="max-w-2xl">
              <span className="font-data-badge text-data-badge text-secondary uppercase tracking-widest font-semibold">
                Vulnerability Calibration
              </span>
              <h2
                className="text-[34px] md:text-[40px] leading-[1.15] text-primary tracking-tight mt-1 font-bold"
                style={{ fontFamily: 'Newsreader, Georgia, serif' }}
              >
                What matters most to you?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                We will use this preference when comparing and scoring routes, matching your personal respiratory profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-xs">
              {profileOptions.map((opt) => {
                const isSelected = profile === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProfile(opt.id)}
                    className={`text-left cursor-pointer rounded-2xl p-space-md transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#ecfdf5] border-2 border-secondary shadow-md'
                        : 'bg-surface-container-low hover:bg-surface-container border border-surface-container'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-space-sm">
                        <span className="text-2xl">{opt.icon}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                        )}
                      </div>
                      <h4 className="font-headline-sm text-[18px] text-primary font-bold">{opt.title}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">{opt.desc}</p>
                    </div>
                    <div className="mt-space-md pt-space-sm border-t border-surface-container-highest">
                      <span className="font-data-badge text-data-badge text-on-surface-variant uppercase">
                        Weighting Tag
                      </span>
                      <p className="font-label-lg text-label-lg text-secondary font-semibold">{opt.badge}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 4: ROUTE PREVIEW & LAUNCH */}
        {currentStep === 4 && (
          <section className="flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div>
                <span className="font-data-badge text-data-badge text-secondary uppercase tracking-widest font-semibold">
                  Synthesized Routes
                </span>
                <h2
                  className="text-[32px] md:text-[38px] text-primary tracking-tight font-bold"
                  style={{ fontFamily: 'Newsreader, Georgia, serif' }}
                >
                  Your <span className="italic font-semibold text-secondary">Optimized Corridors</span>
                </h2>
              </div>

              {routes.length > 0 && (
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={onProceedToComparison}
                    className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">balance</span>
                    Full Matrix
                  </button>
                  <button
                    type="button"
                    onClick={onProceedToMap}
                    className="px-4 py-2 rounded-xl bg-[#14532d] text-white font-label-md text-label-md font-semibold hover:bg-[#166534] transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    Explore on Map
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-[380px] rounded-2xl bg-surface-container-low flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[36px] text-secondary animate-spin">autorenew</span>
                <p className="font-headline-sm text-primary font-bold">Synthesizing live atmospheric corridors...</p>
                <p className="font-body-sm text-on-surface-variant">Calculating tree shade, PM2.5 dispersion, and minute ventilation</p>
              </div>
            ) : routes.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                {/* Map Preview Left */}
                <div className="lg:col-span-7 h-[400px] rounded-2xl overflow-hidden shadow-lg border border-[#a7f3d0]">
                  <MapView
                    origin={origin}
                    destination={destination}
                    routes={routes}
                    selectedRouteId={activeSelectedRoute?.id}
                    onSelectRoute={(id) => setPreviewSelectedId(id)}
                    className="w-full h-full"
                  />
                </div>

                {/* Route Cards Right */}
                <div className="lg:col-span-5 flex flex-col gap-space-sm">
                  {routes.slice(0, 3).map((r) => {
                    const isSelected = activeSelectedRoute?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setPreviewSelectedId(r.id)}
                        className={`p-space-md rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#ecfdf5] border-2 border-secondary shadow-md'
                            : 'bg-surface-container-low border border-surface-container hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-label-md text-label-md font-bold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              {r.isRecommended ? 'eco' : r.isFastest ? 'speed' : 'alt_route'}
                            </span>
                            {r.label}
                          </span>
                          <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-bold">
                            AQI {r.avgAqi}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-body-sm text-on-surface-variant font-data-metric text-[14px]">
                          <span>{r.distanceKm} km • {r.durationMinutes} min</span>
                          <span className="text-[#15803d] font-semibold">{r.healthScore || 85}/100 Health Score</span>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onStartNavigation(activeSelectedRoute?.id)}
                    className="mt-2 w-full h-12 rounded-xl bg-gradient-to-b from-[#15803d] to-[#14532d] text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Start Live Navigation</span>
                    <span className="material-symbols-outlined text-[18px]">navigation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[300px] rounded-2xl bg-surface-container-low flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant">route</span>
                <p className="font-headline-sm text-primary font-bold">Ready to synthesize routes</p>
                <button
                  type="button"
                  onClick={onFindRoutes}
                  className="px-6 py-2.5 rounded-xl bg-[#14532d] text-white font-label-md text-label-md font-semibold shadow-md hover:bg-[#166534] transition-all cursor-pointer"
                >
                  Generate Corridors Now
                </button>
              </div>
            )}
          </section>
        )}

        {/* Wizard Bottom Controls */}
        <div className="flex items-center justify-between pt-space-xl border-t border-[#a7f3d0]/40 mt-space-lg">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-space-lg py-2.5 rounded-xl border border-outline-variant/40 text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-space-xl py-2.5 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center gap-space-xs"
            >
              <span>{currentStep === 3 ? 'Synthesize Corridors' : 'Continue'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onProceedToMap}
              className="px-space-xl py-2.5 rounded-xl bg-[#14532d] hover:bg-[#166534] text-white font-label-lg text-label-lg font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center gap-space-xs"
            >
              <span>Open in Main Map</span>
              <span className="material-symbols-outlined text-[18px]">map</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
