// src/pages/LandingOverview.jsx
// ------------------------------------------------------------------
// Landing / Overview page. Hero with search form, "Why BreatheRoute"
// feature cards, and a route preview section (shown only when routes
// are loaded from the API). All fake data removed.
// ------------------------------------------------------------------

import React from 'react';
import { LEVEL_COLORS } from '../utils/colors';

/** Map an AQI level string to its colour */
function levelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function LandingOverview({
  origin,
  setOrigin,
  destination,
  setDestination,
  mode,
  setMode,
  onStartPlanning,
  onExploreMap,
  onFindRoutes,
  routes,
  loading,
  error,
}) {
  // Walk / Bike toggle helper
  const heroMode = mode === 'cycling' ? 'bike' : 'walk';
  const setHeroMode = (m) => setMode(m === 'bike' ? 'cycling' : 'walking');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    onStartPlanning({ origin, destination, mode: heroMode });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Ambient background glow */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-secondary-container/30 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* ===================== HERO SECTION ===================== */}
        <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">

            {/* Left Column: Headline & Quick Search */}
            <div className="lg:col-span-7 flex flex-col gap-space-lg">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight font-extrabold leading-tight">
                Find the{' '}
                <span className="text-secondary underline decoration-secondary-fixed-dim decoration-4 underline-offset-8">
                  healthiest route
                </span>
                , not just the fastest one.
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                BreatheRoute compares air quality along different paths so you
                can walk or cycle through cleaner corridors every day.
              </p>

              {/* Quick Search Form */}
              <form
                onSubmit={handleQuickSearch}
                className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl shadow-xl max-w-xl border border-white"
                style={{ boxShadow: 'rgba(15,61,42,0.12) 0px 16px 36px -6px' }}
              >
                {/* Mode toggle row */}
                <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                    Quick search
                  </span>
                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setHeroMode('walk')}
                      className={`px-3 py-1 rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all ${
                        heroMode === 'walk'
                          ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                      Walk
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMode('bike')}
                      className={`px-3 py-1 rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all ${
                        heroMode === 'bike'
                          ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">pedal_bike</span>
                      Cycle
                    </button>
                  </div>
                </div>

                {/* Origin & Destination inputs (placeholder – PlaceInput comes in Phase 3) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-sm rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {origin ? origin.label : 'Choose origin in Plan route'}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-sm rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {destination ? destination.label : 'Choose destination in Plan route'}
                    </span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-space-xs h-12 px-space-lg rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:opacity-90 transition-opacity"
                  >
                    Find cleanest route
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExploreMap}
                    className="inline-flex items-center justify-center h-12 px-space-lg rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-all"
                  >
                    Explore map
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Preview or Instruction */}
            <div className="lg:col-span-5 relative">
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden p-space-lg border border-white flex flex-col items-center justify-center min-h-[320px]">
                {routes.length > 0 ? (
                  /* Show a brief route summary if we have results */
                  <div className="w-full space-y-space-md">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Routes found
                    </h3>
                    {routes.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-space-sm rounded-xl border border-surface-container"
                      >
                        <div className="flex items-center gap-space-sm">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: levelColor(r.aqiLevel) }}
                          />
                          <div>
                            <p className="font-label-md text-label-md text-on-surface font-semibold">
                              {r.name}
                            </p>
                            <p className="font-data-badge text-data-badge text-on-surface-variant">
                              {r.time} min · {r.distance} km · AQI {r.aqi}
                            </p>
                          </div>
                        </div>
                        {r.isRecommended && (
                          <span className="font-data-badge text-data-badge px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                            Recommended
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={onExploreMap}
                      className="w-full mt-space-sm inline-flex items-center justify-center gap-space-xs h-10 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      View on map
                    </button>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center">
                    <span className="material-symbols-outlined text-[48px] text-outline-variant mb-space-md block">
                      explore
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Use the search form or go to{' '}
                      <button
                        onClick={() => onStartPlanning({})}
                        className="text-secondary font-semibold hover:underline"
                      >
                        Plan route
                      </button>{' '}
                      to find the best path.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== WHY BREATHEROUTE ===================== */}
      <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-space-lg text-center">
          Why BreatheRoute?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {[
            {
              icon: 'air',
              title: 'Real air quality data',
              desc: 'Routes are scored using live AQI measurements, not estimates or averages.',
            },
            {
              icon: 'compare_arrows',
              title: 'Compare before you go',
              desc: 'See how much cleaner one route is compared to the fastest option.',
            },
            {
              icon: 'cardiology',
              title: 'Tailored to your health',
              desc: 'Choose a health profile so the routing engine prioritises what matters to you.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {card.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pb-space-2xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-space-lg text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {[
            { step: '1', title: 'Pick your start and end', desc: 'Search for places or drop a pin on the map.' },
            { step: '2', title: 'Choose mode and profile', desc: 'Walk or cycle, and select your health sensitivity.' },
            { step: '3', title: 'Compare and go', desc: 'See AQI-scored routes on the map and start navigating.' },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-space-md items-start"
            >
              <span className="w-10 h-10 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </span>
              <div>
                <h3 className="font-label-lg text-label-lg text-on-surface font-bold mb-1">{item.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pb-space-lg">
          <div className="p-space-md bg-error-container text-on-error-container rounded-xl flex items-center gap-space-sm font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
