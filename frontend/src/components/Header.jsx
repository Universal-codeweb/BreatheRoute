// src/components/Header.jsx
// ------------------------------------------------------------------
// BreatheRoute Navbar rebuilt with Craft.do-style motion and feel.
//
// Features:
// - Sticky 64px header, transparent at top, frosted glass on scroll (>8px)
// - Smooth sliding hover pill indicator across nav items (cubic-bezier)
// - Accessible hover & focus dropdown for "Plan route" with upward slide & scale
// - Mobile hamburger that morphs into an X with full-width sheet & staggered items
// - Real "Average AQI N" pill from GET /aqi (hidden if request fails)
// - Respects prefers-reduced-motion
// ------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { getAqiGrid } from '../api';
import { LEVEL_COLORS } from '../utils/colors';

const NAV_LINKS = [
  { id: 'landing', label: 'Overview', icon: 'home' },
  { id: 'route-planner', label: 'Plan route', icon: 'alt_route', hasDropdown: true },
  { id: 'map-explorer', label: 'Map', icon: 'map' },
  { id: 'route-comparison', label: 'Compare', icon: 'balance' },
  { id: 'active-navigation', label: 'Navigate', icon: 'navigation' },
];

const PLAN_DROPDOWN_ITEMS = [
  { label: 'Search a route', desc: 'Find clean air corridors', icon: 'search' },
  { label: 'Health profile', desc: 'Asthma, child, elderly & general', icon: 'health_and_safety' },
  { label: 'Preview', desc: 'Inspect conditions on map', icon: 'visibility' },
];

function getLevel(aqi) {
  if (aqi <= 50) return 'clean';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'high';
  return 'poor';
}

export default function Header({ activeTab, setActiveTab }) {
  // Scroll frosted state
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dropdown state for "Plan route"
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownCloseTimer = useRef(null);
  const dropdownRef = useRef(null);
  const planButtonRef = useRef(null);

  // Sliding pill indicator state
  const navContainerRef = useRef(null);
  const linkRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoveredTab, setHoveredTab] = useState(null);

  // Real Average AQI from API
  const [avgAqi, setAvgAqi] = useState(null);

  // Prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Scroll listener for frosting effect (>8px)
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
        // Silently hide the status pill if API fails / not configured
        if (isMounted) setAvgAqi(null);
      });
    return () => { isMounted = false; };
  }, []);

  // Update sliding pill position
  const updatePill = (tabId) => {
    const el = linkRefs.current[tabId];
    const container = navContainerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPillStyle({
        left: elRect.left - containerRect.left,
        width: elRect.width,
        opacity: 1,
      });
    }
  };

  // Synchronize pill with activeTab or hovered item
  useEffect(() => {
    const target = hoveredTab || activeTab;
    updatePill(target);
  }, [activeTab, hoveredTab]);

  // Window resize re-measures pill
  useEffect(() => {
    const handleResize = () => updatePill(hoveredTab || activeTab);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, hoveredTab]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) {
          setDropdownOpen(false);
          planButtonRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen, mobileMenuOpen]);

  // Dropdown open/close handlers with delay
  const handleDropdownEnter = () => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current);
      dropdownCloseTimer.current = null;
    }
    setDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownCloseTimer.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 180);
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aqiLevel = avgAqi !== null ? getLevel(avgAqi) : null;
  const aqiColor = aqiLevel ? LEVEL_COLORS[aqiLevel] : '#186c42';

  return (
    <header
      className={`sticky top-0 z-50 w-full h-16 transition-[background-color,backdrop-filter,border-color,box-shadow] ${reducedMotion ? '' : 'duration-200 ease-out'
        } ${isScrolled
          ? 'bg-surface/80 backdrop-blur-md border-b border-surface-container shadow-sm'
          : 'bg-transparent border-b border-transparent shadow-none'
        }`}
    >
      <div className="max-w-7xl mx-auto h-full px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">

        {/* Left: Brand Logo & Title */}
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -ml-1 group flex-shrink-0 cursor-pointer"
          aria-label="BreatheRoute home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">air</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
            BreatheRoute
          </span>
        </button>

        {/* Center: Desktop Navigation with Craft-style Sliding Pill */}
        <nav
          ref={navContainerRef}
          onMouseLeave={() => setHoveredTab(null)}
          aria-label="Main navigation"
          className="hidden lg:flex relative items-center p-1 bg-surface-container-low/70 rounded-full border border-surface-container/80 backdrop-blur-sm"
        >
          {/* Sliding Pill Indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-surface shadow-xs pointer-events-none"
            style={{
              transform: `translateX(${pillStyle.left}px)`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
              transition: reducedMotion
                ? 'none'
                : 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease-out',
            }}
          />

          {NAV_LINKS.map((link) => {
            const isActive = activeTab === link.id;
            const isPlanLink = link.hasDropdown;

            return (
              <div
                key={link.id}
                className="relative"
                onMouseEnter={isPlanLink ? handleDropdownEnter : undefined}
                onMouseLeave={isPlanLink ? handleDropdownLeave : undefined}
              >
                <button
                  ref={(el) => (linkRefs.current[link.id] = el)}
                  onClick={() => handleNavClick(link.id)}
                  onMouseEnter={() => setHoveredTab(link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-haspopup={isPlanLink ? 'true' : undefined}
                  aria-expanded={isPlanLink ? dropdownOpen : undefined}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full font-label-md text-label-md font-medium transition-colors cursor-pointer select-none flex items-center gap-1.5 ${isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                  {isPlanLink && (
                    <span
                      className={`material-symbols-outlined text-[14px] transition-transform ${reducedMotion ? '' : 'duration-160 ease-out'
                        } ${dropdownOpen ? 'rotate-180' : ''}`}
                    >
                      expand_more
                    </span>
                  )}
                </button>

                {/* Craft-style Dropdown Menu for "Plan route" */}
                {isPlanLink && (
                  <div
                    ref={dropdownRef}
                    role="menu"
                    aria-label="Plan route menu"
                    className={`absolute left-0 top-full mt-2 w-64 p-2 bg-surface/95 backdrop-blur-xl border border-surface-container rounded-2xl shadow-xl transition-all ${reducedMotion ? '' : 'duration-160 ease-out origin-top'
                      } ${dropdownOpen
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-y-2 scale-[0.98] pointer-events-none'
                      }`}
                  >
                    <div className="space-y-1">
                      {PLAN_DROPDOWN_ITEMS.map((item, idx) => (
                        <button
                          key={idx}
                          role="menuitem"
                          onClick={() => handleNavClick('route-planner')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container transition-colors group flex items-start gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                          </div>
                          <div>
                            <div className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary">
                              {item.label}
                            </div>
                            <div className="font-body-sm text-[12px] text-on-surface-variant leading-tight">
                              {item.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: Honest AQI Pill + Primary "Find route" CTA */}
        <div className="flex items-center gap-2.5 flex-shrink-0">

          {/* Honest Average AQI status pill (hidden if request fails) */}
          {avgAqi !== null && (
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-data-badge text-data-badge font-semibold select-none border border-black/5"
              style={{
                backgroundColor: `${aqiColor}18`,
                color: aqiColor,
              }}
              title="Coverage Area Average Air Quality Index"
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: aqiColor }}
              />
              <span>Avg AQI {avgAqi}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => handleNavClick('route-planner')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer ${reducedMotion ? '' : 'active:scale-95'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>Find route</span>
          </button>

          {/* Mobile Hamburger Button with morphing 2 bars */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1.5 bg-surface-container-low hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              className={`w-5 h-[2px] bg-on-surface rounded-full transition-transform ${reducedMotion ? '' : 'duration-200 ease-out'
                } ${mobileMenuOpen
                  ? 'translate-y-[4px] rotate-45'
                  : 'translate-y-0 rotate-0'
                }`}
            />
            <span
              className={`w-5 h-[2px] bg-on-surface rounded-full transition-transform ${reducedMotion ? '' : 'duration-200 ease-out'
                } ${mobileMenuOpen
                  ? '-translate-y-[4px] -rotate-45'
                  : 'translate-y-0 rotate-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop and Full-Width Sheet */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-16 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <div
        className={`fixed top-16 left-0 right-0 z-50 lg:hidden bg-surface/95 backdrop-blur-xl border-b border-surface-container shadow-2xl overflow-hidden transition-all ${reducedMotion ? '' : 'duration-200 ease-out'
          } ${mobileMenuOpen
            ? 'opacity-100 translate-y-0 max-h-[85vh] pointer-events-auto'
            : 'opacity-0 -translate-y-3 max-h-0 pointer-events-none'
          }`}
      >
        <div className="px-margin py- space-y-2 max-h-[calc(85vh-32px)] overflow-y-auto">
          {NAV_LINKS.map((link, idx) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  transitionDelay: mobileMenuOpen ? `${idx * 40}ms` : '0ms',
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl font-label-md text-label-md font-medium flex items-center justify-between transition-all ${reducedMotion ? '' : 'duration-200 ease-out'
                  } ${mobileMenuOpen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                  } ${isActive
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-low'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {link.icon}
                  </span>
                  <span className="text-[15px]">{link.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                )}
              </button>
            );
          })}

          {/* Mobile Bottom Info & Find Route Button */}
          <div className="pt-3 border-t border-surface-container mt-3 space-y-2">
            {avgAqi !== null && (
              <div
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-data-badge text-data-badge font-semibold"
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
                <span className="text-[14px] font-bold">{avgAqi}</span>
              </div>
            )}

            <button
              onClick={() => handleNavClick('route-planner')}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Find cleanest route
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
