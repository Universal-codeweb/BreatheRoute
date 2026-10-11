// src/components/Header.jsx
// ------------------------------------------------------------------
// Clean, flat "hackathon landing page" navbar for BreatheRoute.
// Logo on the left, plain text links in the center, profile badge &
// mobile toggle on the right. Simple, accessible, lightweight.
// ------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { getAqiGrid } from '../api';
import { LEVEL_COLORS } from '../utils/colors';

// Navigation links config
const NAV_LINKS = [
  { id: 'landing', label: 'Overview', icon: 'home' },
  { id: 'route-planner', label: 'Plan route', icon: 'alt_route' },
  { id: 'map-explorer', label: 'Map', icon: 'map' },
  { id: 'route-comparison', label: 'Compare', icon: 'balance' },
];

const PROFILE_LABELS = {
  general: 'General',
  asthma: 'Asthma',
  elderly: 'Elderly',
  child: 'Child',
};

// Map AQI number to qualitative risk level
function getLevel(aqi) {
  if (aqi <= 50) return 'clean';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'high';
  return 'poor';
}

export default function Header({ activeTab, setActiveTab, onNavigate, profile }) {
  // Frosted background toggle on scroll (>8px)
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile menu visibility toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Average AQI from live backend telemetry
  const [avgAqi, setAvgAqi] = useState(null);

  // Track window scroll to switch background style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real average AQI from backend
  useEffect(() => {
    let isMounted = true;
    getAqiGrid()
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.cells) && data.cells.length > 0) {
          const sum = data.cells.reduce((acc, c) => acc + (c.aqi || 0), 0);
          setAvgAqi(Math.round(sum / data.cells.length));
        }
      })
      .catch(() => {
        if (isMounted) setAvgAqi(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Unified navigation click handler
  const handleNavClick = (id, step) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(id, step);
    } else {
      setActiveTab(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const aqiLevel = avgAqi !== null ? getLevel(avgAqi) : null;
  const aqiColor = aqiLevel ? LEVEL_COLORS[aqiLevel] : '#16a34a';

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b ${
        isScrolled
          ? 'bg-white/25 dark:bg-slate-950/25 backdrop-blur-md shadow-xs border-white/20 dark:border-white/10'
          : 'bg-white/10 dark:bg-slate-950/10 backdrop-blur-sm border-white/10 dark:border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Logo & Wordmark + Optional AQI pill */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg p-1 -ml-1 transition-opacity duration-150 hover:opacity-90 cursor-pointer"
            aria-label="BreatheRoute home"
          >
            <img
              alt="BreatheRoute Logo"
              className="h-8 w-8 object-contain rounded-lg shadow-xs"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBspYAOaDLHofmuwl_UkxFLbBYtDNjNf5X9ysEnCk9fM_RFMrA-iBfE1_ICpdfEUH5xOOk_guGth_qC_mbfZA_9eSFijaLhpr4MezX_uYR7hiaSGiAztB1l0XuupqVFIWNpPHVhst0zNVGGaN8yt0yZ4gre2UvN3OLVKkb4d-4h2SF_r9aDgcCUeDECb2T6FwlCRQsSR5rR5iEkz7ik8-szo7j8PmG0l5rq5AbSSKcSVK1bSaE41M3yqpJjCNEZePu1Cw"
            />
            <span className="text-[20px] text-primary tracking-[-0.03em] font-bold select-none leading-none">
              Breathe<span className="text-secondary font-semibold italic">Route</span>
            </span>
          </button>

          {/* Real Average AQI status pill on extra-large screens */}
          {avgAqi !== null && (
            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[11px] font-semibold text-[#166534]">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: aqiColor }}
              />
              <span>AQI {avgAqi}</span>
            </div>
          )}
        </div>

        {/* Center: Plain text nav links (Desktop) */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 h-full">
          {NAV_LINKS.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`h-full inline-flex items-center text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  isActive
                    ? 'font-bold text-primary border-b-2 border-primary'
                    : 'font-medium text-on-surface-variant hover:text-primary border-b-2 border-transparent'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Built on AWS + Profile badge + Mobile toggle */}
        <div className="flex items-center gap-2.5">
          {/* Built on AWS badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-xs">
            <span className="material-symbols-outlined text-[15px] text-amber-600">cloud</span>
            <span>Built on AWS</span>
          </div>

          {/* Health profile badge */}
          <button
            type="button"
            onClick={() => handleNavClick('route-planner', 3)}
            title="Change health profile"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container hover:bg-secondary-container text-xs font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <span className="material-symbols-outlined text-[15px]">eco</span>
            <span>{PROFILE_LABELS[profile] || 'General'} profile</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-surface-container-low hover:bg-surface-container transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <span
              className={`w-5 h-[2px] bg-on-surface rounded-full transition-transform duration-150 ease-out ${
                mobileMenuOpen ? 'translate-y-[4px] rotate-45' : ''
              }`}
            />
            <span
              className={`w-5 h-[2px] bg-on-surface rounded-full transition-transform duration-150 ease-out ${
                mobileMenuOpen ? '-translate-y-[4px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-16 bg-black/25 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-50 lg:hidden bg-surface-container-lowest/85 backdrop-blur-xl border-b border-outline-variant/20 shadow-xl">
          <div className="px-4 py-4 space-y-2 max-h-[calc(85vh-32px)] overflow-y-auto">
            {/* Stacked Nav Links */}
            {NAV_LINKS.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-secondary" />}
                </button>
              );
            })}

            {/* Profile Row for Mobile */}
            <button
              type="button"
              onClick={() => handleNavClick('route-planner', 3)}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2 border border-outline-variant/30 transition-colors duration-150 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">eco</span>
              <span>Health profile: {PROFILE_LABELS[profile] || 'General'}</span>
            </button>

            {/* Area AQI Row */}
            {avgAqi !== null && (
              <div
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: `${aqiColor}15`,
                  color: aqiColor,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: aqiColor }}
                  />
                  <span>Coverage Area Average AQI</span>
                </div>
                <span className="text-[13px] font-bold">{avgAqi}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
