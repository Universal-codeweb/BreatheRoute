// src/components/Footer.jsx
// ------------------------------------------------------------------
// App footer with navigation links and required attribution.
// Removed fake claims (EPA Tier IV, CPCB, sensor nodes, 62% stat).
// ------------------------------------------------------------------

import React from 'react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 pt-space-2xl pb-space-xl mt-auto">
      <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl mb-space-2xl">

          {/* Brand & Mission */}
          <div className="space-y-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[20px]">air</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                BreatheRoute
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Routing engine that helps pedestrians and cyclists find
              cleaner air corridors for their daily commutes.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-space-md">
              Navigation
            </h4>
            <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <button
                  onClick={() => setActiveTab('landing')}
                  className="hover:text-primary transition-colors text-left"
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('route-planner')}
                  className="hover:text-primary transition-colors text-left"
                >
                  Plan route
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('map-explorer')}
                  className="hover:text-primary transition-colors text-left"
                >
                  Map explorer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('route-comparison')}
                  className="hover:text-primary transition-colors text-left"
                >
                  Route comparison
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('active-navigation')}
                  className="hover:text-primary transition-colors text-left"
                >
                  Active navigation
                </button>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-label-lg text-label-lg text-on-surface font-bold mb-space-md">
              About
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              BreatheRoute uses real-time air quality data to suggest
              routes that balance travel time with lower pollution exposure.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-space-lg border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md text-on-surface-variant font-data-badge text-data-badge">
          <div>
            © {new Date().getFullYear()} BreatheRoute.
          </div>
          <div className="flex items-center gap-space-md">
            <span>Map data via Amazon Location Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}