// src/pages/RoutePlanning.jsx
// ------------------------------------------------------------------
// 4-Step Route Planning Wizard with MapView and PlaceInput.
// Designed with BreatheRoute Award-Winning UI:
// - Left: 4-step wizard with modern stepper & card-based options
// - Right: Sticky desktop MapView (collapsible on mobile)
// - Step 1: Waypoints (Origin & Destination PlaceInput + pick mode)
// - Step 2: Travel Mode (Walking vs Cycling with speed/ventilation)
// - Step 3: Health Profile (General, Asthma, Elderly, Child with routing rules)
// - Step 4: Review & Synthesize (Summary card with Edit links + Find Cleanest Route)
// ------------------------------------------------------------------

import React, { useState } from 'react';
import PlaceInput from '../components/PlaceInput';
import MapView from '../components/MapView';
import {
  Card,
  Button,
  AqiBadge,
  Badge,
  ErrorState,
} from '../components/ui';

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
  initialStep = 1,
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [pickMode, setPickMode] = useState(null); // 'origin' | 'destination' | null
  const [previewSelectedId, setPreviewSelectedId] = useState(null);
  const [stepError, setStepError] = useState(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  // Stepper metadata
  const steps = [
    { step: 1, title: 'Waypoints', subtitle: 'Start & destination' },
    { step: 2, title: 'Travel Mode', subtitle: 'Speed & effort' },
    { step: 3, title: 'Health Profile', subtitle: 'Lung vulnerability' },
    { step: 4, title: 'Review & Plan', subtitle: 'Cleanest corridor' },
  ];

  // Travel Mode options
  const modeOptions = [
    {
      id: 'walking',
      icon: 'directions_walk',
      title: 'Walking',
      speed: '~4.5 km/h',
      ventilation: '12 L/min average',
      description:
        'Pedestrian-optimized paths prioritizing tree shade canopies, continuous sidewalks, and low-exhaust residential alleys.',
      criteria: 'Shade trees · Sidewalks · Zero highway',
    },
    {
      id: 'cycling',
      icon: 'pedal_bike',
      title: 'Cycling',
      speed: '~18.0 km/h',
      ventilation: '38 L/min (aerobic)',
      description:
        'Low-gradient routes (<4%) avoiding stop-and-go intersections and high-particulate diesel idling corridors.',
      criteria: 'Protected lanes · Low gradient (<4%) · Clean air',
    },
  ];

  // Health Profile options
  const profileOptions = [
    {
      id: 'general',
      icon: 'person',
      title: 'General Commuter',
      tag: 'Balanced Inhalation',
      description:
        'Standard environmental weighting balancing time, distance, and particulate exposure.',
    },
    {
      id: 'asthma',
      icon: 'air',
      title: 'Asthma / Reactive',
      tag: 'Max PM2.5 Priority',
      description:
        'Strict penalty for fine particulates and diesel smoke pockets. Detours around traffic bottlenecks.',
    },
    {
      id: 'elderly',
      icon: 'nature_people',
      title: 'Elderly',
      tag: 'Comfort & Shade',
      description:
        'Prioritizes continuous botanical shade, gentle inclines, and paved sidewalk corridors with benches.',
    },
    {
      id: 'child',
      icon: 'child_care',
      title: 'Child / Stroller',
      tag: 'Zero Exhaust Zone',
      description:
        'Maximizes park buffer zones away from tailpipe levels, avoiding high-speed multi-lane road crossings.',
    },
  ];

  const profileLabels = {
    general: 'General Commuter',
    asthma: 'Asthma / Reactive',
    elderly: 'Elderly',
    child: 'Child / Stroller',
  };

  // Step navigation handlers
  const handleNext = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!origin || !destination) {
        setStepError('Please select both a starting location and a destination.');
        return;
      }
      if (origin.lat === destination.lat && origin.lng === destination.lng) {
        setStepError('Origin and destination cannot be the same location.');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFindRoutesClick = async () => {
    setStepError(null);
    if (!origin || !destination) {
      setCurrentStep(1);
      setStepError('Please set both origin and destination first.');
      return;
    }
    await onFindRoutes({ navigateToMap: false });
  };

  const activeSelectedRoute =
    routes.find((r) => r.id === previewSelectedId) ||
    routes.find((r) => r.isRecommended) ||
    routes[0] ||
    null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Plan your{' '}
            <span className="text-[#15803d] underline decoration-[#86efac] decoration-2 underline-offset-4">
              clean air journey
            </span>
          </h1>
        </div>
      </div>

      {/* Modern Glassmorphic Stepper Header */}
      <div className="relative mb-8 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/90 shadow-[0_12px_36px_rgba(21,128,61,0.06),0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 ring-1 ring-slate-900/5 overflow-hidden">
        {/* Ambient emerald gradient edge reflection */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/20 via-[#15803d]/40 to-emerald-500/20 pointer-events-none" />

        <div className="flex flex-col gap-3.5 relative z-10">
          {/* Progress Bar & Status */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
              <span className="font-mono font-extrabold uppercase tracking-widest text-[#15803d]">
                Step 0{currentStep} / 04: {steps[currentStep - 1].title}
              </span>
            </div>
            <span className="text-slate-600 font-semibold font-mono bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
              {Math.round((currentStep / 4) * 100)}% Complete
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100/80 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className="h-full bg-gradient-to-r from-[#15803d] to-[#22c55e] transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          {/* Stepper Circles */}
          <div className="relative flex items-center justify-between px-3 sm:px-6 py-2">
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200/80 -z-0" />
            {/* Active Track Line */}
            <div
              className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#15803d] to-[#22c55e] -z-0 transition-all duration-500 shadow-xs"
              style={{
                width: `${((currentStep - 1) / 3) * 100}%`,
                maxWidth: 'calc(100% - 4rem)',
              }}
            />

            {steps.map((s) => {
              const isCompleted = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < currentStep || currentStep === 4) setCurrentStep(s.step);
                  }}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus-visible:outline-none"
                  aria-label={`Go to step ${s.step}: ${s.title}`}
                >
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-mono transition-all duration-300 ${isCompleted
                      ? 'bg-[#15803d] text-white shadow-[0_0_12px_rgba(21,128,61,0.35)] ring-4 ring-white'
                      : isCurrent
                        ? 'bg-gradient-to-br from-[#15803d] to-[#16a34a] text-white ring-4 ring-emerald-200/80 shadow-[0_0_18px_rgba(34,197,94,0.5)] scale-110'
                        : 'bg-white/90 backdrop-blur-sm text-slate-400 border border-slate-300/80 ring-4 ring-white/60 group-hover:border-slate-400 group-hover:scale-105'
                      }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      <span>{s.step}</span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 hidden sm:block tracking-tight transition-colors ${isCurrent
                      ? 'text-[#15803d] font-bold drop-shadow-2xs'
                      : isCompleted
                        ? 'text-slate-800 font-medium'
                        : 'text-slate-400 font-medium'
                      }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Map Toggle */}
      <div className="lg:hidden mb-6">
        <Button
          variant="secondary"
          size="md"
          icon="map"
          onClick={() => setMobileMapOpen((prev) => !prev)}
          className="w-full justify-between"
        >
          <span>{mobileMapOpen ? 'Hide Interactive Map' : 'View Interactive Map'}</span>
          <span className="material-symbols-outlined text-[18px]">
            {mobileMapOpen ? 'expand_less' : 'expand_more'}
          </span>
        </Button>
        {mobileMapOpen && (
          <div className="mt-3 h-[320px] rounded-2xl overflow-hidden border border-slate-200 shadow-soft">
            <MapView
              origin={origin}
              destination={destination}
              routes={routes}
              selectedRouteId={activeSelectedRoute?.id}
              routeColorOverride="#15803d"
              onSelectRoute={(id) => setPreviewSelectedId(id)}
              onPickLocation={(loc) => {
                if (pickMode === 'origin') {
                  setOrigin(loc);
                  setPickMode(null);
                } else if (pickMode === 'destination') {
                  setDestination(loc);
                  setPickMode(null);
                }
              }}
              pickMode={pickMode}
              onCancelPick={() => setPickMode(null)}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Wizard Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card
            variant="glass"
            p="lg"
            className="!bg-white/80 !backdrop-blur-2xl !border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.04),0_2px_12px_rgba(21,128,61,0.05)] rounded-3xl min-h-[520px] flex flex-col justify-between ring-1 ring-slate-900/5"
          >
            {/* ======================================================
                STEP 1: WAYPOINTS (ORIGIN & DESTINATION)
                ====================================================== */}
            {currentStep === 1 && (
              <div className="page-transition flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#15803d]">
                      Step 01 · Spatial Coordinates
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Where are you heading?
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Set your origin and target destination. Use search, GPS, or click to pinpoint directly on the map.
                  </p>
                </div>

                {pickMode && (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-center justify-between text-xs text-[#166534]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#15803d]">
                        touch_app
                      </span>
                      <span>
                        Click anywhere on the map to set{' '}
                        <strong>{pickMode === 'origin' ? 'start location' : 'destination'}</strong>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickMode(null)}
                      className="font-bold underline cursor-pointer hover:text-[#14532d]"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  <PlaceInput
                    label="Starting location"
                    placeholder="Search start address or use GPS..."
                    value={origin}
                    onChange={setOrigin}
                    onPickOnMap={() => setPickMode('origin')}
                    isPicking={pickMode === 'origin'}
                  />

                  <PlaceInput
                    label="Target destination"
                    placeholder="Search destination address..."
                    value={destination}
                    onChange={setDestination}
                    onPickOnMap={() => setPickMode('destination')}
                    isPicking={pickMode === 'destination'}
                  />

                  {stepError && (
                    <div className="text-red-700 text-xs bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                      <span>{stepError}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#15803d] text-[20px] mt-0.5">
                    park
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-[#15803d]">Micro-corridor preview:</strong> We analyze satellite canopy foliage density and CAAQMS particulate data along street geometry between your points.
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================
                STEP 2: TRAVEL MODE
                ====================================================== */}
            {currentStep === 2 && (
              <div className="page-transition flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#15803d]">
                      Step 02 · Locomotion Model
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    How will you travel?
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Speed and physical exertion directly dictate how many litres of air pass through your lungs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modeOptions.map((opt) => {
                    const isSelected = mode === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setMode(opt.id)}
                        className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-150 flex flex-col justify-between ${isSelected
                          ? 'bg-[#f0fdf4] border-2 border-[#15803d] ring-2 ring-[#86efac]/50 shadow-soft'
                          : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                          }`}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMode(opt.id);
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#15803d] text-white flex items-center justify-center shadow-2xs">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </div>
                        )}

                        <div>
                          <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[26px]">
                              {opt.icon}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{opt.title}</h3>
                            <span className="text-xs font-mono font-bold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                              {opt.speed}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            {opt.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex flex-col gap-1 font-mono">
                          <div>
                            Ventilation: <strong className="text-slate-800">{opt.ventilation}</strong>
                          </div>
                          <div className="text-[#15803d] font-semibold">{opt.criteria}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>


              </div>
            )}

            {/* ======================================================
                STEP 3: HEALTH PROFILE
                ====================================================== */}
            {currentStep === 3 && (
              <div className="page-transition flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#15803d]">
                      Step 03 · Vulnerability Calibration
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Select your health profile
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Different lungs have different tolerances. We adjust particulate weights and slope thresholds accordingly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profileOptions.map((opt) => {
                    const isSelected = profile === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setProfile(opt.id)}
                        className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-150 flex flex-col justify-between ${isSelected
                          ? 'bg-[#f0fdf4] border-2 border-[#15803d] ring-2 ring-[#86efac]/50 shadow-soft'
                          : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                          }`}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setProfile(opt.id);
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#15803d] text-white flex items-center justify-center shadow-2xs">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </div>
                        )}

                        <div>
                          <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-[22px]">
                              {opt.icon}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mb-0.5">
                            {opt.title}
                          </h3>
                          <span className="inline-block text-[10px] font-mono font-bold text-[#15803d] uppercase tracking-wider mb-2">
                            {opt.tag}
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================
                STEP 4: REVIEW & SYNTHESIZE
                ====================================================== */}
            {currentStep === 4 && (
              <div className="page-transition flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#15803d]">
                      Step 04 · Review &amp; Synthesize
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Review your clean route
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Double-check your parameters, then compute the highest botanical canopy corridor.
                  </p>
                </div>

                {/* Summary Card with Edit links */}
                <Card variant="default" p="md" className="border-slate-200 bg-slate-50/60 shadow-2xs">
                  <div className="divide-y divide-slate-200/80 text-xs">
                    {/* Origin */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="material-symbols-outlined text-[#15803d] text-[18px]">
                          trip_origin
                        </span>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">
                            Start Location
                          </span>
                          <span className="font-semibold text-slate-900 truncate block">
                            {origin?.label || 'Not selected'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[#15803d] hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Destination */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="material-symbols-outlined text-[#15803d] text-[18px]">
                          location_on
                        </span>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">
                            Destination
                          </span>
                          <span className="font-semibold text-slate-900 truncate block">
                            {destination?.label || 'Not selected'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[#15803d] hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Mode */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#15803d] text-[18px]">
                          {mode === 'cycling' ? 'pedal_bike' : 'directions_walk'}
                        </span>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">
                            Mode
                          </span>
                          <span className="font-semibold text-slate-900 capitalize">
                            {mode} ({mode === 'cycling' ? '~18 km/h' : '~4.5 km/h'})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[#15803d] hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Health Profile */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#15803d] text-[18px]">
                          health_and_safety
                        </span>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">
                            Health Sensitivity
                          </span>
                          <span className="font-semibold text-slate-900">
                            {profileLabels[profile] || profile}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[#15803d] hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </Card>

                {/* API Error State */}
                {error && (
                  <ErrorState
                    title="Route Calculation Failed"
                    message={error}
                    onRetry={handleFindRoutesClick}
                    retryText="Try finding routes again"
                  />
                )}

                {/* Synthesized Routes List (if already computed) */}
                {routes.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {routes.length} Corridors Synthesized
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onProceedToComparison}
                          className="text-xs text-[#15803d] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">balance</span>
                          Comparison Matrix
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={onProceedToMap}
                          className="text-xs text-[#15803d] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">map</span>
                          Full Map
                        </button>
                      </div>
                    </div>

                    {routes.slice(0, 3).map((r) => {
                      const isSelected = activeSelectedRoute?.id === r.id;
                      return (
                        <Card
                          key={r.id}
                          variant={isSelected ? 'highlight' : 'default'}
                          p="sm"
                          interactive
                          onClick={() => setPreviewSelectedId(r.id)}
                          className="border-slate-200"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{r.label}</span>
                                {r.isRecommended && (
                                  <Badge variant="mint" size="sm">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {r.distanceKm} km · {r.durationMinutes} min · {r.healthScore || 85}/100 Health Score
                              </div>
                            </div>
                            <AqiBadge aqi={r.avgAqi} size="sm" />
                          </div>
                        </Card>
                      );
                    })}

                    <Button
                      variant="primary"
                      size="lg"
                      icon="navigation"
                      iconPosition="right"
                      onClick={() => onStartNavigation(activeSelectedRoute?.id)}
                      className="w-full text-base font-bold shadow-md mt-2"
                    >
                      Start Live Navigation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Wizard Navigation (Fixed & Consistent Position) */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 mt-8">
              <Button
                variant="ghost"
                size="md"
                icon="arrow_back"
                disabled={currentStep === 1}
                onClick={handlePrev}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  icon="arrow_forward"
                  iconPosition="right"
                  onClick={handleNext}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon="alt_route"
                  iconPosition="right"
                  loading={loading}
                  onClick={handleFindRoutesClick}
                >
                  {routes.length > 0 ? 'Recalculate Corridors' : 'Find cleanest route'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Desktop MapView */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <Card variant="default" p="none" className="overflow-hidden border-slate-200 shadow-lift">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Corridor Geometry
                </span>
              </div>
              {activeSelectedRoute && (
                <AqiBadge aqi={activeSelectedRoute.avgAqi} size="sm" />
              )}
            </div>

            <div className="h-[520px] w-full relative">
              <MapView
                origin={origin}
                destination={destination}
                routes={routes}
                selectedRouteId={activeSelectedRoute?.id}
                routeColorOverride="#15803d"
                onSelectRoute={(id) => setPreviewSelectedId(id)}
                onPickLocation={(loc) => {
                  if (pickMode === 'origin') {
                    setOrigin(loc);
                    setPickMode(null);
                  } else if (pickMode === 'destination') {
                    setDestination(loc);
                    setPickMode(null);
                  }
                }}
                pickMode={pickMode}
                onCancelPick={() => setPickMode(null)}
                className="w-full h-full"
              />
            </div>

            <div className="p-3 bg-white text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between font-mono">
              <span>MapLibre GL Telemetry</span>
              <span className="text-[#15803d] font-semibold">
                {origin && destination ? 'Waypoints Placed' : 'Awaiting Waypoints'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
