// src/pages/LandingOverview.jsx
// ------------------------------------------------------------------
// BreatheRoute Landing & Overview Page
// Features:
// - Two-line editorial Hero with glass search card & live AQI chip
// - Scroll-driven environmental background (healthy -> polluted)
// - 01 / Problem (editable stat cards)
// - 02 / How it works (4 numbered steps with icons)
// - 03 / Compare (BreatheRoute vs Normal Maps table)
// - Fig. 1 Route Showcase (click-to-expand cards with AqiBadge)
// - Pollutants slow marquee (PM2.5, PM10, NO2, O3, CO)
// - FAQ accordion & final CTA band
// - First-visit loader (< 1.2s) & desktop custom cursor
// ------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import PlaceInput from '../components/PlaceInput';
import {
  Card,
  Button,
  SectionLabel,
} from '../components/ui';
import cloudVideoSrc from '../assets/cloud-moving.mp4';

// ==================================================================
// EDITABLE CONTENT CONSTANTS
// ==================================================================

const HERO_CONTENT = {
  bracketTag: 'Clean commute intelligence',
  headlineMuted: 'Maps find the fastest way.',
  headlineLead: 'With the ',
  headlineAccent: 'cleanest',
  headlineEnd: ' air.',
};

const PROBLEM_STATS = [
  {
    value: '4.2M',
    label: 'Premature deaths / year',
    description:
      'Attributed to outdoor ambient PM2.5 inhalation worldwide, with commuters bearing the peak acute exposure.',
    icon: 'coronavirus',
    trend: '+12% in dense cities',
  },
  {
    value: '3.8×',
    label: 'Highway pollution spike',
    description:
      'Concentration of black carbon and volatile hydrocarbons along main arterial roads compared to adjacent avenues.',
    icon: 'warning',
    trend: 'Peak at 8-10 AM & 6-8 PM',
  },
  {
    value: '64%',
    label: 'Exposure reduction',
    description:
      'Average particulate drop observed by shifting routes just 150 meters into mature tree canopy corridors.',
    icon: 'park',
    trend: 'Verified via micro-sensors',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Search destination',
    description:
      'Enter your origin and destination. BreatheRoute scans the micro-climate grid between them.',
    icon: 'search',
  },
  {
    step: '02',
    title: 'Choose travel mode',
    description:
      'Select walking or cycling. Breathing depth, heart rate, and inhalation speed are factored into the score.',
    icon: 'directions_walk',
  },
  {
    step: '03',
    title: 'Select health profile',
    description:
      'Tailor routes for general health, asthma, elderly lungs, or children with specialized sensitivity thresholds.',
    icon: 'health_and_safety',
  },
  {
    step: '04',
    title: 'Cleanest route navigation',
    description:
      'Follow turn-by-turn guidance prioritizing clean air corridors and dense botanical tree canopies.',
    icon: 'park',
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Live micro-climate AQI',
    detail: 'Continuous station and satellite PM2.5 telemetry',
    breatheRoute: true,
    normalMaps: false,
  },
  {
    feature: 'Avoids polluted roads',
    detail: 'Routes around diesel corridors, traffic bottlenecks, and idling zones',
    breatheRoute: true,
    normalMaps: false,
  },
  {
    feature: 'Health-profile aware',
    detail: 'Personalized filters for asthma, elderly lungs, and children',
    breatheRoute: true,
    normalMaps: false,
  },
  {
    feature: 'Fastest route option',
    detail: 'Always see the fastest baseline to compare time vs lung cost',
    breatheRoute: true,
    normalMaps: true,
  },
  {
    feature: 'Canopy coverage scoring',
    detail: 'Calculates shading index and natural particulate filtration',
    breatheRoute: true,
    normalMaps: false,
  },
];

// ==================================================================
// MAIN LANDING OVERVIEW COMPONENT
// ==================================================================

export default function LandingOverview({
  origin,
  setOrigin,
  destination,
  setDestination,
  mode,
  setMode,
  onStartPlanning,
  _onExploreMap,
  onFindRoutes,
  _routes = [],
  loading = false,
  error = null,
  onNavigate,
}) {
  const heroMode = mode === 'cycling' ? 'bike' : 'walk';
  const setHeroMode = (m) => setMode(m === 'bike' ? 'cycling' : 'walking');

  // First-visit loader state (< 1.2s)
  const [showFirstVisitLoader, setShowFirstVisitLoader] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !sessionStorage.getItem('breatheroute_visited');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showFirstVisitLoader) return;
    const timer = setTimeout(() => {
      setShowFirstVisitLoader(false);
      try {
        sessionStorage.setItem('breatheroute_visited', 'true');
      } catch { }
    }, 1050);
    return () => clearTimeout(timer);
  }, [showFirstVisitLoader]);

  // Quick search submission handler
  const handleQuickSearch = (e) => {
    e?.preventDefault();
    if (origin && destination) {
      if (onFindRoutes) onFindRoutes();
      else if (onNavigate) onNavigate('map-explorer');
    } else {
      onStartPlanning({ origin, destination, mode: heroMode });
    }
  };

  return (
    <div className="flex flex-col w-full relative min-h-screen">
      {/* Short First-Visit Loader (< 1.2s) */}
      {showFirstVisitLoader && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06281b] text-white transition-opacity duration-300 pointer-events-auto"
          aria-live="polite"
          aria-label="Clearing the air"
        >
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#22c55e]/30 border-t-[#4ade80] animate-spin" />
            <img
              alt="BreatheRoute"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBspYAOaDLHofmuwl_UkxFLbBYtDNjNf5X9ysEnCk9fM_RFMrA-iBfE1_ICpdfEUH5xOOk_guGth_qC_mbfZA_9eSFijaLhpr4MezX_uYR7hiaSGiAztB1l0XuupqVFIWNpPHVhst0zNVGGaN8yt0yZ4gre2UvN3OLVKkb4d-4h2SF_r9aDgcCUeDECb2T6FwlCRQsSR5rR5iEkz7ik8-szo7j8PmG0l5rq5AbSSKcSVK1bSaE41M3yqpJjCNEZePu1Cw"
              className="absolute w-10 h-10 object-contain rounded-lg"
            />
          </div>
          <p className="text-lg font-bold tracking-tight text-white mb-1">
            Breathe<span className="text-[#4ade80] italic">Route</span>
          </p>
          <p className="text-xs text-[#86efac]/80 font-mono tracking-widest uppercase animate-pulse">
            Clearing the air…
          </p>
        </div>
      )}

      {/* ============================================================
          HERO SECTION (Transparent over background video)
          ============================================================ */}
      <section className="relative w-full overflow-hidden pt-8 pb-20 md:pt-12 md:pb-28">
        {/* Cloud moving video background - strictly in this hero container only */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/cloud-moving.mp4" type="video/mp4" />
            <source src={cloudVideoSrc} type="video/mp4" />
          </video>
          {/* Subtle gradient wash to blend into the rest of the landing page */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-[#f8faf9]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Headline Area */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.035em] leading-[1.08] text-slate-900 drop-shadow-xs">
                <span className="block text-slate-600 font-bold">
                  {HERO_CONTENT.headlineMuted}
                </span>
                <span className="block mt-1">
                  {HERO_CONTENT.headlineLead}
                  <span className="text-[#15803d] underline decoration-[#86efac] decoration-4 underline-offset-8">
                    {HERO_CONTENT.headlineAccent}
                  </span>
                  {HERO_CONTENT.headlineEnd}
                </span>
              </h1>
            </div>

            {/* Right Search Card (Glass variant - extra transparent) */}
            <div className="lg:col-span-5">
              <Card
                variant="glass"
                p="md"
                className="!bg-white/25 !backdrop-blur-xl !border-white/50 shadow-2xl flex flex-col gap-4 [&_.font-label-md]:text-slate-800 [&_input]:!bg-white/40 [&_input]:!backdrop-blur-md [&_input]:!border-white/50 [&_input]:text-slate-900 [&_input]:placeholder:text-slate-600 [&_input]:focus:!bg-white/70"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Route Air Quality Check
                  </span>

                  {/* Mode Toggle (Walk / Cycle) */}
                  <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md p-1 rounded-xl border border-white/40">
                    <button
                      type="button"
                      onClick={() => setHeroMode('walk')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${heroMode === 'walk'
                          ? 'bg-[#15803d] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">directions_walk</span>
                      Walk
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMode('bike')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${heroMode === 'bike'
                          ? 'bg-[#15803d] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">pedal_bike</span>
                      Cycle
                    </button>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="flex flex-col gap-2.5">
                  <PlaceInput
                    label="Starting location"
                    placeholder="Enter starting location..."
                    value={origin}
                    onChange={setOrigin}
                  />
                  <PlaceInput
                    label="Destination"
                    placeholder="Enter destination..."
                    value={destination}
                    onChange={setDestination}
                  />
                </div>

                {error && (
                  <div className="text-red-700 text-xs bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  variant="primary"
                  size="md"
                  icon="alt_route"
                  iconPosition="right"
                  loading={loading}
                  onClick={handleQuickSearch}
                  className="w-full text-sm font-bold"
                >
                  {loading ? 'Analyzing Corridors…' : 'Find cleanest route'}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          01 / PROBLEM SECTION (3 editable stat cards)
          ============================================================ */}
      <section className="relative w-full bg-white/40 backdrop-blur-md py-16 sm:py-20 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <SectionLabel number="01" label="Problem" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Urban navigation ignores respiratory hazards
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Commuters spend hours in traffic corridors breathing concentrated combustion particulates that are easily bypassed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROBLEM_STATS.map((stat) => (
              <Card
                key={stat.label}
                variant="default"
                p="md"
                interactive
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 tracking-tight mb-1 font-mono">
                    {stat.value}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          02 / HOW IT WORKS (4 numbered steps with icons)
          ============================================================ */}
      <section className="relative w-full bg-white/30 backdrop-blur-md py-16 sm:py-20 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <SectionLabel number="02" label="How it works" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Atmospheric physics meets micro-corridor routing
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Four streamlined steps to navigate your city with zero respiratory compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <Card
                key={item.step}
                variant="default"
                p="md"
                interactive
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#15803d]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          03 / COMPARE TABLE (BreatheRoute vs Normal Maps)
          ============================================================ */}
      <section className="relative w-full bg-white/40 backdrop-blur-md py-16 sm:py-20 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <SectionLabel number="03" label="Compare" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              How BreatheRoute stacks against standard maps
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Traditional GPS engines optimize for cars. BreatheRoute optimizes for human lungs.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-600 font-mono">
                  <th className="py-4 px-6 font-bold">Capability</th>
                  <th className="py-4 px-6 font-bold w-1/3 bg-[#ecfdf5]/70 text-[#166534] border-x border-[#bbf7d0]/60">
                    BreatheRoute
                  </th>
                  <th className="py-4 px-6 font-bold w-1/3">Standard Navigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{row.feature}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{row.detail}</div>
                    </td>
                    <td className="py-4 px-6 bg-[#f0fdf4]/60 border-x border-[#bbf7d0]/40">
                      <div className="flex items-center gap-2 text-[#15803d] font-bold">
                        <span className="material-symbols-outlined text-[20px] text-[#16a34a]">
                          check_circle
                        </span>
                        <span>Supported</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {row.normalMaps ? (
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <span className="material-symbols-outlined text-[18px] text-slate-500">
                            check
                          </span>
                          <span>Supported</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="material-symbols-outlined text-[18px] text-slate-300">
                            cancel
                          </span>
                          <span>Not supported</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
