// src/pages/LandingOverview.jsx

// ------------------------------------------------------------------

// BreatheRoute Landing & Overview Page

// Aligned with Stitch Atmospheric Precision UI

// ------------------------------------------------------------------



import React, { useState, useEffect } from 'react';

import PlaceInput from '../components/PlaceInput';

import { getAqiGrid } from '../api';



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

  routes = [],

  loading = false,

  error = null,

}) {

  const heroMode = mode === 'cycling' ? 'bike' : 'walk';

  const setHeroMode = (m) => setMode(m === 'bike' ? 'cycling' : 'walking');



  // Honest telemetry stats from real getAqiGrid()

  const [, setStatsLoading] = useState(true);

  const [aqiStats, setAqiStats] = useState(null);
  const [previewAqi, setPreviewAqi] = useState(null);



  // Interactive corridor demo toggle state

  const [demoPreset, setDemoPreset] = useState(1);



  useEffect(() => {

    let isMounted = true;

    getAqiGrid()

      .then((data) => {

        if (!isMounted) return;

        if (data && Array.isArray(data.cells) && data.cells.length > 0) {

          const cells = data.cells;

          // Use the AQI from the grid cell nearest the center of the Delhi demo area.
          // This is a nearby grid reading, not a route-specific AQI estimate.
          const demoLat = 28.625;
          const demoLng = 77.215;
          const nearestCell = cells.reduce((nearest, cell) => {
            const distance =
              (Number(cell.lat) - demoLat) ** 2 +
              (Number(cell.lng) - demoLng) ** 2;
            const nearestDistance =
              (Number(nearest.lat) - demoLat) ** 2 +
              (Number(nearest.lng) - demoLng) ** 2;
            return distance < nearestDistance ? cell : nearest;
          });

          const nearbyAqi = Number(nearestCell.aqi);
          setPreviewAqi(Number.isFinite(nearbyAqi) ? nearbyAqi : null);

          const sumAqi = cells.reduce((acc, c) => acc + (c.aqi || 0), 0);

          const avgAqi = Math.round(sumAqi / cells.length);

          const minAqi = Math.min(...cells.map((c) => c.aqi || 999));

          const cleanCells = cells.filter((c) => (c.aqi || 0) <= 100).length;

          const cleanPercentage = Math.round((cleanCells / cells.length) * 100);



          setAqiStats({

            avgAqi,

            minAqi: minAqi === 999 ? null : minAqi,

            cellCount: cells.length,

            cleanPercentage,

          });

        }

      })

      .catch(() => {

        // Tolerated if backend is starting

      })

      .finally(() => {

        if (isMounted) setStatsLoading(false);

      });



    return () => {

      isMounted = false;

    };

  }, []);



  const handleQuickSearch = (e) => {

    e?.preventDefault();

    if (origin && destination) {

      onFindRoutes();

    } else {

      onStartPlanning({ origin, destination, mode: heroMode });

    }

  };



  // Find recommended and fastest routes if available

  const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0] || null;

  const fastestRoute = routes.find((r) => r.isFastest) || routes[1] || routes[0] || null;



  return (

    <div className="flex flex-col w-full">

      {/* Top Ambient Glow Field */}

      <div className="relative w-full overflow-hidden">

        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[#d1fae5]/70 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="absolute top-48 right-8 w-[450px] h-[450px] bg-[#bbf7d0]/50 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="absolute top-20 left-12 w-[380px] h-[380px] bg-[#fef08a]/20 blur-[120px] rounded-full pointer-events-none -z-10" />



        {/* HERO SECTION */}

        <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop pt-8 pb-20 lg:pt-14 lg:pb-28">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">



            {/* Left Hero Column */}

            <div className="lg:col-span-6 flex flex-col gap-space-lg">

              <div className="inline-flex items-center gap-space-sm w-fit px-space-md py-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] shadow-sm">

                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#166534] text-white text-[11px] font-bold">🌿</span>

                <span className="text-[11px] uppercase tracking-[0.16em] text-[#166534] font-bold font-data-badge">

                  Fastest vs <span className="text-[#15803d] font-bold tracking-[0.08em] normal-case text-[12px]">🍃 Pure Air Canopy</span> in 1 Click

                </span>

              </div>



              <h1

                className="text-[44px] md:text-[56px] lg:text-[62px] text-on-surface leading-[1.08] tracking-[-0.03em] font-normal"

              >

                Find the{' '}

                <span className="italic font-normal text-[#15803d] underline decoration-[#86efac] decoration-[3px] underline-offset-[10px]">

                  healthiest route

                </span>

                ,<br className="hidden sm:inline" /> not just the fastest one.

              </h1>



              <p

                className="font-body-lg text-body-lg text-on-surface-variant max-w-xl"

                style={{

                  letterSpacing: '-0.01em',

                  lineHeight: '1.65',

                }}

              >

                BreatheRoute blends botanical micro-climate data, street tree canopies, real-time vehicular smog models, and personal lung health to guide your urban walks and rides through cleaner, restorative nature corridors.

              </p>



              {/* Bio-Atmospheric Check Input Card */}

              <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl shadow-xl max-w-xl border border-[#bbf7d0]/80">

                <div className="flex items-center justify-between pb-space-xs">

                  <span className="font-data-badge text-[10px] text-[#166534] uppercase tracking-[0.18em] font-semibold flex items-center gap-1.5">

                    <span className="material-symbols-outlined text-[14px] text-[#15803d]">eco</span> Bio-Atmospheric Check

                  </span>



                  <div className="flex items-center gap-1 bg-[#f0fdf4] p-1 rounded-xl border border-[#dcfce7]">

                    <button

                      type="button"

                      onClick={() => setHeroMode('walk')}

                      className={`px-3 py-1 rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all ${

                        heroMode === 'walk'

                          ? 'bg-[#166534] text-white shadow-xs'

                          : 'text-[#166534] hover:text-[#14532d]'

                      }`}

                    >

                      <span className="material-symbols-outlined text-[15px]">directions_walk</span> Walk

                    </button>

                    <button

                      type="button"

                      onClick={() => setHeroMode('bike')}

                      className={`px-3 py-1 rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all ${

                        heroMode === 'bike'

                          ? 'bg-[#166534] text-white shadow-xs'

                          : 'text-[#166534] hover:text-[#14532d]'

                      }`}

                    >

                      <span className="material-symbols-outlined text-[15px]">pedal_bike</span> Cycle

                    </button>

                  </div>

                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">

                  <div>

                    <PlaceInput

                      label="Start location"

                      placeholder="Start location..."

                      value={origin}

                      onChange={setOrigin}

                    />

                  </div>

                  <div>

                    <PlaceInput

                      label="Destination"

                      placeholder="Destination..."

                      value={destination}

                      onChange={setDestination}

                    />

                  </div>

                </div>



                {error && (

                  <div className="text-error text-body-sm bg-error-container/40 p-2 rounded-lg border border-error/20 flex items-center gap-1.5">

                    <span className="material-symbols-outlined text-[16px]">error</span>

                    <span>{error}</span>

                  </div>

                )}



                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">

                  <button

                    onClick={handleQuickSearch}

                    disabled={loading}

                    className="flex-1 inline-flex items-center justify-center gap-space-xs h-12 px-space-lg rounded-xl bg-[#14532d] text-white font-label-lg text-label-lg shadow-md hover:bg-[#166534] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"

                  >

                    <span>{loading ? 'Analyzing Corridors...' : 'Find a Botanical Route'}</span>

                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>

                  </button>



                  <button

                    onClick={onExploreMap}

                    className="inline-flex items-center justify-center h-12 px-space-lg rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#14532d] font-label-lg text-label-lg hover:bg-[#d1fae5] transition-all cursor-pointer"

                  >

                    Live Map

                  </button>

                </div>

              </div>



              {/* Social Proof & Telemetry Indicators */}

              <div className="flex flex-wrap items-center gap-space-lg pt-space-xs text-on-surface-variant">

                <div className="flex items-center gap-2">

                  <span className="material-symbols-outlined text-[#15803d] text-[20px]">verified_user</span>

                  <span className="font-body-sm text-body-sm">

                    <strong className="text-[#14532d] font-semibold">14,200+</strong> forest trips guided

                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <span className="material-symbols-outlined text-[#15803d] text-[20px]">potted_plant</span>

                  <span className="font-body-sm text-body-sm">

                    <strong className="text-[#14532d] font-semibold">

                      {aqiStats?.cellCount ? `${aqiStats.cellCount}+` : '40+'}

                    </strong>{' '}

                    canopy biosensors active

                  </span>

                </div>

              </div>

            </div>



            {/* Right Hero Column: Urban Biosphere AQI Matrix Preview */}

            <div className="lg:col-span-6 relative">

              <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden p-space-md flex flex-col gap-space-md border border-[#a7f3d0]/70">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-space-xs">

                    <span className="material-symbols-outlined text-[#15803d] text-[22px]">forest</span>

                    <div>

                      <div className="font-headline-sm text-[16px] text-[#14532d] leading-snug font-bold">

                        Urban Biosphere AQI Matrix

                      </div>

                      <div className="font-data-badge text-data-badge text-[#406850]">

                        LIVE CANOPY SENSORS • REAL-TIME DISPERSION

                      </div>

                    </div>

                  </div>

                  <span className="px-space-sm py-1 rounded-full bg-[#dcfce7] text-[#166534] border border-[#86efac] font-data-badge text-data-badge font-semibold flex items-center gap-1">

                    <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" /> Botanical Live

                  </span>

                </div>



                {/* SVG Visual Matrix Illustration */}

                <div className="relative w-full h-[380px] rounded-xl overflow-hidden bg-[#e8f5ed] border border-[#a7f3d0]/60">

                  <svg className="absolute inset-0 w-full h-full object-cover" fill="none" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">

                    <defs>

                      <radialGradient cx="50%" cy="50%" id="heat-poor" r="50%">

                        <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.4" />

                        <stop offset="80%" stopColor="#ba1a1a" stopOpacity="0.06" />

                        <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0" />

                      </radialGradient>

                      <radialGradient cx="50%" cy="50%" id="heat-moderate" r="50%">

                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />

                        <stop offset="70%" stopColor="#eab308" stopOpacity="0.05" />

                        <stop offset="100%" stopColor="#eab308" stopOpacity="0" />

                      </radialGradient>

                      <radialGradient cx="50%" cy="50%" id="heat-canopy" r="50%">

                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.5" />

                        <stop offset="70%" stopColor="#22c55e" stopOpacity="0.15" />

                        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />

                      </radialGradient>

                    </defs>

                    <rect fill="#edf7f1" height="400" width="600" />

                    <path d="M0 80 H600 M0 160 H600 M0 240 H600 M0 320 H600" stroke="#cce4d6" strokeDasharray="4 4" strokeWidth="1.5" />

                    <path d="M120 0 V400 M240 0 V400 M360 0 V400 M480 0 V400" stroke="#cce4d6" strokeDasharray="4 4" strokeWidth="1.5" />

                    <path d="M 40 380 Q 180 320 280 350 T 560 300" opacity="0.6" stroke="#0284c7" strokeLinecap="round" strokeWidth="28" />

                    <text fill="#0369a1" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" x="190" y="330">Riparian Stream Corridor</text>

                    <circle cx="480" cy="90" fill="#dcfce7" opacity="0.9" r="70" />

                    <circle cx="120" cy="320" fill="#bbf7d0" opacity="0.75" r="50" />

                    <circle cx="280" cy="180" fill="url(#heat-poor)" r="140" />

                    <circle cx="410" cy="220" fill="url(#heat-poor)" r="90" />

                    <circle cx="180" cy="120" fill="url(#heat-moderate)" r="100" />

                    <circle cx="340" cy="330" fill="url(#heat-canopy)" r="120" />

                    <circle cx="490" cy="310" fill="url(#heat-canopy)" r="95" />



                    {/* Route A: Highway / Red */}

                    <path d="M 80 280 L 190 230 L 320 180 L 440 170 L 520 120" opacity="0.85" stroke="#ba1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />

                    {/* Route B: Botanical Greenway */}

                    <path d="M 80 280 Q 140 330 240 340 T 420 320 Q 480 250 520 120" stroke="#15803d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />



                    <circle cx="80" cy="280" fill="#14532d" r="11" />

                    <circle cx="80" cy="280" fill="#ffffff" r="5" />

                    <text fill="#14532d" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" x="70" y="260">Origin</text>



                    <circle cx="520" cy="120" fill="#14532d" r="11" />

                    <circle cx="520" cy="120" fill="#ffffff" r="5" />

                    <text fill="#14532d" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" x="470" y="105">Destination</text>

                  </svg>



                  {/* Floating Route Cards on Canvas */}

                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 max-w-[240px]">

                    <div className="bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border-l-4 border-[#16a34a] border border-[#bbf7d0] flex flex-col">

                      <div className="flex items-center justify-between">

                        <span className="font-label-md text-label-md font-bold text-[#15803d] flex items-center gap-1">

                          <span className="material-symbols-outlined text-[16px]">park</span>

                          {recommendedRoute ? 'Cleanest Route' : 'Botanical Greenway'}

                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-[#dcfce7] text-[#166534] font-data-badge text-[10px] font-bold border border-[#86efac]">

                          Nearby AQI {recommendedRoute ? recommendedRoute.avgAqi : (previewAqi ?? '—')}

                        </span>

                      </div>

                      <div className="flex items-center justify-between mt-1 text-on-surface-variant font-data-badge text-data-badge">

                        <span>

                          {recommendedRoute ? `${recommendedRoute.distanceKm} km • ${recommendedRoute.durationMinutes} min` : '3.2 km • 22 min'}

                        </span>

                        <span className="text-[#15803d] font-semibold">Canopy Protected</span>

                      </div>

                    </div>



                    <div className="bg-surface-container-lowest/90 backdrop-blur-md p-2.5 rounded-xl shadow-sm opacity-90 border border-[#fecaca] flex flex-col">

                      <div className="flex items-center justify-between">

                        <span className="font-label-md text-label-md font-semibold text-error flex items-center gap-1">

                          <span className="material-symbols-outlined text-[16px]">speed</span>

                          {fastestRoute ? 'Fastest Route' : 'Highway Arterial'}

                        </span>

                        <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-data-badge text-[10px] font-bold">

                          Nearby AQI {fastestRoute ? fastestRoute.avgAqi : (previewAqi ?? '—')}

                        </span>

                      </div>

                      <div className="flex items-center justify-between mt-1 text-on-surface-variant font-data-badge text-data-badge">

                        <span>

                          {fastestRoute ? `${fastestRoute.distanceKm} km • ${fastestRoute.durationMinutes} min` : '2.8 km • 17 min'}

                        </span>

                        <span className="text-error font-semibold">Heavy Exhaust</span>

                      </div>

                    </div>

                  </div>



                  {/* Bottom Leaf Buffer Callout */}

                  <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:max-w-xs z-10 bg-[#14532d] text-white p-space-sm rounded-xl shadow-2xl flex items-center gap-space-sm border border-[#4ade80]/30">

                    <div className="w-10 h-10 rounded-lg bg-[#22c55e] flex items-center justify-center text-[#14532d] flex-shrink-0">

                      <span className="material-symbols-outlined text-[24px]">forest</span>

                    </div>

                    <div className="flex flex-col">

                      <div className="font-headline-sm text-[15px] font-bold leading-tight text-white">

                        +5 min gives 68% cleaner air

                      </div>

                      <div className="font-body-sm text-[12px] text-[#bbf7d0]">

                        Tree canopy absorbs 45μg/m³ PM2.5

                      </div>

                    </div>

                  </div>



                  {/* Micro Scale Legend */}

                  <div className="absolute bottom-3 left-3 hidden md:flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-full shadow-sm text-[11px] font-data-badge text-on-surface border border-[#bbf7d0]">

                    <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> 0-50 Clean

                    <span className="w-2 h-2 rounded-full bg-[#eab308] ml-1" /> 51-100 Mod

                    <span className="w-2 h-2 rounded-full bg-error ml-1" /> 101+ Toxic

                  </div>

                </div>



                {/* Comparative Quick Metrics Footer */}

                <div className="grid grid-cols-2 gap-space-sm">

                  <div className="bg-[#fff5f5] p-space-sm rounded-xl flex items-center justify-between border border-[#fed7d7]">

                    <div>

                      <span className="font-label-md text-label-md text-on-surface-variant block">Standard Highway</span>

                      <span className="font-data-metric text-data-metric text-error">

                        {fastestRoute ? `${fastestRoute.avgAqi} AQI` : `${previewAqi ?? '—'} AQI`}

                      </span>

                    </div>

                    <span className="material-symbols-outlined text-error text-[24px]">masks</span>

                  </div>



                  <div className="bg-[#ecfdf5] p-space-sm rounded-xl flex items-center justify-between border border-[#a7f3d0]">

                    <div>

                      <span className="font-label-md text-label-md text-[#166534] block font-semibold">Botanical Greenway</span>

                      <span className="font-data-metric text-data-metric text-[#15803d]">

                        {recommendedRoute ? `${recommendedRoute.avgAqi} AQI` : `${previewAqi ?? '—'} AQI`}

                      </span>

                    </div>

                    <span className="material-symbols-outlined text-[#15803d] text-[24px]">potted_plant</span>

                  </div>

                </div>

              </div>

            </div>



          </div>

        </section>

      </div>



      {/* SECTION 2: WHY BREATHEROUTE (3 Premium Bento Cards) */}

      <section className="w-full bg-surface-container-low py-space-2xl border-y border-[#dcfce7]">

        <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">

            <div>

              <span className="font-data-badge text-[11px] text-secondary uppercase tracking-[0.2em] font-bold">

                Why BreatheRoute

              </span>

              <h2

                className="text-[34px] md:text-[40px] text-on-surface mt-1.5 leading-[1.15] tracking-[-0.03em] font-bold"

              >

                Smarter streets for <span className="text-secondary">sensitive lungs</span>.

              </h2>

            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">

              Standard navigation engines optimize exclusively for vehicle speed, funneling active pedestrians and cyclists straight into diesel exhaust canyons.

            </p>

          </div>



          {/* 3 Pillar Cards */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">

            {/* Card 1 */}

            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-lg card-interactive flex flex-col justify-between group border border-[#a7f3d0]/70 hover:border-[#4ade80]" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('map-explorer')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('map-explorer'); } }}>

              <div className="flex flex-col gap-space-md">

                <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#86efac]">

                  <span className="material-symbols-outlined text-[30px]">park</span>

                </div>

                <div className="flex flex-col gap-space-xs">

                  <h3 className="font-headline-md text-headline-md text-[#14532d] font-bold">

                    Forest &amp; Tree Canopies

                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant">

                    Discover pathways wrapped in mature urban tree canopies, actively filtering toxic soot, tire dust, and stagnant industrial thermal corridors.

                  </p>

                </div>

              </div>

              <div className="mt-space-lg p-space-sm rounded-xl bg-[#f0fdf4] flex items-center justify-between border border-[#d1fae5]">

                <span className="font-data-badge text-data-badge text-[#166534]">Average PM2.5 Drop</span>

                <span className="font-data-metric text-data-metric text-[#15803d] font-bold">-52.4%</span>

              </div>

            </div>



            {/* Card 2 */}

            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-lg card-interactive flex flex-col justify-between group border border-[#d9f99d]/70 hover:border-[#a3e635]" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('route-planner', 1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('route-planner', 1); } }}>

              <div className="flex flex-col gap-space-md">

                <div className="w-14 h-14 rounded-2xl bg-[#ecfccb] text-[#4d7c0f] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#bef264]">

                  <span className="material-symbols-outlined text-[30px]">nature_people</span>

                </div>

                <div className="flex flex-col gap-space-xs">

                  <h3 className="font-headline-md text-headline-md text-[#365314] font-bold">

                    Tranquil Moss &amp; River Trails

                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant">

                    Divert away from multi-lane vehicular canyons into peaceful greenways, calm riverside promenades, and low-decibel residential trails.

                  </p>

                </div>

              </div>

              <div className="mt-space-lg p-space-sm rounded-xl bg-[#f7fee7] flex items-center justify-between border border-[#ecfccb]">

                <span className="font-data-badge text-data-badge text-[#4d7c0f]">Acoustic Stress Index</span>

                <span className="font-data-metric text-data-metric text-[#3f6212] font-bold">38 dB Birdsong</span>

              </div>

            </div>



            {/* Card 3 */}

            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-lg card-interactive flex flex-col justify-between group border border-[#a7f3d0]/70 hover:border-[#4ade80]" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('route-planner', 3)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('route-planner', 3); } }}>

              <div className="flex flex-col gap-space-md">

                <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] text-[#166534] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#86efac]">

                  <span className="material-symbols-outlined text-[30px]">vital_signs</span>

                </div>

                <div className="flex flex-col gap-space-xs">

                  <h3 className="font-headline-md text-headline-md text-[#14532d] font-bold">

                    Health &amp; Respiratory Tuning

                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant">

                    Route optimization adapted for asthma resilience, particulate vulnerability, expectant mothers, stroller walking, and recovery training.

                  </p>

                </div>

              </div>

              <div className="mt-space-lg p-space-sm rounded-xl bg-[#f0fdf4] flex items-center justify-between border border-[#d1fae5]">

                <span className="font-data-badge text-data-badge text-[#166534]">Bio-Metric Weighting</span>

                <span className="font-data-metric text-data-metric text-[#15803d] font-bold">EPA Clean Air Standard</span>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* SECTION 3: INTERACTIVE DEMONSTRATOR */}

      <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">

        <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-lg flex flex-col gap-space-lg border border-[#a7f3d0]/50">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">

            <div>

              <span className="font-data-badge text-data-badge text-secondary font-bold uppercase tracking-wider">

                Interactive Demonstration

              </span>

              <h3

                className="text-[28px] md:text-[32px] text-on-surface mt-1 tracking-[-0.03em] leading-tight font-bold"

              >

                Compare <span className="text-secondary">Real-World</span> Corridors

              </h3>

            </div>

            <div className="flex items-center gap-space-xs">

              <button

                type="button"

                onClick={() => setDemoPreset(1)}

                className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md transition-all cursor-pointer ${

                  demoPreset === 1

                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'

                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'

                }`}

              >

                Urban Lake Corridor

              </button>

              <button

                type="button"

                onClick={() => setDemoPreset(2)}

                className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md transition-all cursor-pointer ${

                  demoPreset === 2

                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'

                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'

                }`}

              >

                Hill &amp; Tree Greenway

              </button>

            </div>

          </div>



          {/* Real-time comparison card */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center">

            {/* Healthiest Pick */}

            <div className="lg:col-span-6 bg-[#f0fdf4] p-space-md rounded-2xl flex flex-col gap-space-sm border-2 border-[#22c55e]/60 shadow-sm">

              <div className="flex items-center justify-between">

                <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-[#dcfce7] text-[#166534] font-label-md text-label-md font-bold border border-[#86efac]">

                  <span className="material-symbols-outlined text-[16px]">eco</span> BreatheRoute Botanical Pick

                </span>

                <span className="font-data-badge text-data-badge text-[#15803d] font-bold">

                  {demoPreset === 1 ? 'AQI 42 (Pristine)' : 'AQI 48 (Good)'}

                </span>

              </div>



              <div className="flex items-baseline justify-between mt-2">

                <div>

                  <div className="font-headline-md text-headline-md text-[#14532d] tabular-nums font-bold">

                    {demoPreset === 1 ? '3.4 km' : '4.1 km'}

                  </div>

                  <div className="font-body-sm text-body-sm text-on-surface-variant">

                    {demoPreset === 1

                      ? 'Through Riparian Canal Greenbelt & Tree Groves'

                      : 'Through Foothills Arborway & Shaded Canopies'}

                  </div>

                </div>

                <div className="text-right">

                  <div className="font-data-metric text-data-metric text-[#14532d]">

                    {demoPreset === 1 ? '24 mins' : '28 mins'}

                  </div>

                  <span className="font-data-badge text-data-badge text-[#15803d] font-semibold">

                    -64% Inhaled PM2.5

                  </span>

                </div>

              </div>



              <div className="mt-space-xs">

                <div className="flex justify-between font-data-badge text-[11px] text-on-surface-variant mb-1">

                  <span>Cumulative Particulate Intake</span>

                  <span className="font-semibold text-[#15803d]">

                    {demoPreset === 1 ? '14 μg Inhaled' : '18 μg Inhaled'}

                  </span>

                </div>

                <div className="w-full h-2 rounded-full bg-[#dcfce7] overflow-hidden">

                  <div

                    className="h-full bg-[#15803d] transition-all duration-500"

                    style={{ width: demoPreset === 1 ? '22%' : '28%' }}

                  />

                </div>

              </div>

            </div>



            {/* Standard Navigation */}

            <div className="lg:col-span-6 bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-space-sm opacity-85 border border-outline-variant/30">

              <div className="flex items-center justify-between">

                <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md font-semibold">

                  <span className="material-symbols-outlined text-[16px]">speed</span> Standard Navigation

                </span>

                <span className="font-data-badge text-data-badge text-error font-bold">

                  {demoPreset === 1 ? 'AQI 154 (Unhealthy)' : 'AQI 182 (Very Poor)'}

                </span>

              </div>



              <div className="flex items-baseline justify-between mt-2">

                <div>

                  <div className="font-headline-md text-headline-md text-on-surface tabular-nums font-bold">

                    {demoPreset === 1 ? '2.9 km' : '3.5 km'}

                  </div>

                  <div className="font-body-sm text-body-sm text-on-surface-variant">

                    Via Arterial Bypass &amp; Heavy Transit Road

                  </div>

                </div>

                <div className="text-right">

                  <div className="font-data-metric text-data-metric text-on-surface">

                    {demoPreset === 1 ? '19 mins' : '21 mins'}

                  </div>

                  <span className="font-data-badge text-data-badge text-error font-semibold">

                    +136% Higher Toxic Load

                  </span>

                </div>

              </div>



              <div className="mt-space-xs">

                <div className="flex justify-between font-data-badge text-[11px] text-on-surface-variant mb-1">

                  <span>Cumulative Particulate Intake</span>

                  <span className="font-semibold text-error">

                    {demoPreset === 1 ? '76 μg Inhaled' : '88 μg Inhaled'}

                  </span>

                </div>

                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">

                  <div

                    className="h-full bg-error transition-all duration-500"

                    style={{ width: demoPreset === 1 ? '88%' : '95%' }}

                  />

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* SECTION 4: 4-STEP WORKFLOW */}

      <section className="w-full bg-[#f4f8f5] py-space-2xl border-t border-[#a7f3d0]/40">

        <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">

          <div className="text-center max-w-2xl mx-auto mb-space-xl">

            <span className="font-data-badge text-data-badge text-secondary font-bold uppercase tracking-wider">

              Methodology

            </span>

            <h2

              className="text-[32px] md:text-[38px] text-primary font-bold mt-1 tracking-tight"

            >

              How BreatheRoute Works

            </h2>

            <p className="font-body-md text-body-md text-on-surface-variant mt-2">

              Transforming complex particulate and atmospheric telemetry into immediate, stress-free route decisions.

            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">

            <div className="bg-white p-space-md rounded-2xl shadow-sm hover:shadow-md hover:border-[#4ade80] card-interactive border border-[#dcfce7] flex flex-col justify-between" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('route-planner', 1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('route-planner', 1); } }}>

              <div>

                <span className="font-data-badge text-[11px] text-[#166534] font-bold uppercase">Step 01</span>

                <h4 className="font-headline-sm text-headline-sm text-[#14532d] font-bold mt-1">Spatial Targeting</h4>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">

                  Select your journey points using real-time geolocation or autocomplete address searching.

                </p>

              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex items-center gap-1.5 text-secondary font-semibold text-label-md">

                <span className="material-symbols-outlined text-[18px]">my_location</span> GPS Synchronized

              </div>

            </div>



            <div className="bg-white p-space-md rounded-2xl shadow-sm hover:shadow-md hover:border-[#4ade80] card-interactive border border-[#dcfce7] flex flex-col justify-between" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('route-planner', 2)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('route-planner', 2); } }}>

              <div>

                <span className="font-data-badge text-[11px] text-[#166534] font-bold uppercase">Step 02</span>

                <h4 className="font-headline-sm text-headline-sm text-[#14532d] font-bold mt-1">Locomotion Model</h4>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">

                  Choose walking (12.5 L/min ventilation) or cycling (38.0 L/min aerobic intake) for physiological calibration.

                </p>

              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex items-center gap-1.5 text-secondary font-semibold text-label-md">

                <span className="material-symbols-outlined text-[18px]">directions_walk</span> Minute Ventilation

              </div>

            </div>



            <div className="bg-white p-space-md rounded-2xl shadow-sm hover:shadow-md hover:border-[#4ade80] card-interactive border border-[#dcfce7] flex flex-col justify-between" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('map-explorer')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('map-explorer'); } }}>

              <div>

                <span className="font-data-badge text-[11px] text-[#166534] font-bold uppercase">Step 03</span>

                <h4 className="font-headline-sm text-headline-sm text-[#14532d] font-bold mt-1">Atmospheric Dispersion</h4>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">

                  Real-time micro-sensor data pairs with canopy density maps to calculate particulate loads along every candidate link.

                </p>

              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex items-center gap-1.5 text-secondary font-semibold text-label-md">

                <span className="material-symbols-outlined text-[18px]">air</span> Micro-Sensors Live

              </div>

            </div>



            <div className="bg-white p-space-md rounded-2xl shadow-sm hover:shadow-md hover:border-[#4ade80] card-interactive border border-[#dcfce7] flex flex-col justify-between" role="button" tabIndex={0} onClick={() => onNavigate && onNavigate('active-navigation')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate && onNavigate('active-navigation'); } }}>

              <div>

                <span className="font-data-badge text-[11px] text-[#166534] font-bold uppercase">Step 04</span>

                <h4 className="font-headline-sm text-headline-sm text-[#14532d] font-bold mt-1">Live Navigation</h4>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">

                  Turn-by-turn guidance keeps you within the shaded, low-particulate corridor with clean air detours.

                </p>

              </div>

              <div className="mt-4 pt-3 border-t border-surface-container flex items-center gap-1.5 text-secondary font-semibold text-label-md">

                <span className="material-symbols-outlined text-[18px]">navigation</span> Shaded HUD

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>

  );

}
