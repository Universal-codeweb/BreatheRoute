// src/components/Footer.jsx
// ------------------------------------------------------------------
// BreatheRoute footer with working navigation links.
// ------------------------------------------------------------------

import React from 'react';

const LINKS = [
  { id: 'landing', label: 'Overview' },
  { id: 'route-planner', label: 'Plan route' },
  { id: 'map-explorer', label: 'Map' },
  { id: 'route-comparison', label: 'Compare' },
];

export default function Footer({ setActiveTab, onNavigate }) {
  const go = (id) => {
    if (onNavigate) onNavigate(id);
    else {
      setActiveTab(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-surface-container-low mt-space-2xl py-space-xl border-t border-[#a7f3d0]/40 no-print">
      <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <button
            type="button"
            onClick={() => go('landing')}
            className="flex items-center gap-space-xs text-left group"
            aria-label="BreatheRoute home"
          >
            <img
              alt="BreatheRoute Logo"
              className="h-8 w-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBspYAOaDLHofmuwl_UkxFLbBYtDNjNf5X9ysEnCk9fM_RFMrA-iBfE1_ICpdfEUH5xOOk_guGth_qC_mbfZA_9eSFijaLhpr4MezX_uYR7hiaSGiAztB1l0XuupqVFIWNpPHVhst0zNVGGaN8yt0yZ4gre2UvN3OLVKkb4d-4h2SF_r9aDgcCUeDECb2T6FwlCRQsSR5rR5iEkz7ik8-szo7j8PmG0l5rq5AbSSKcSVK1bSaE41M3yqpJjCNEZePu1Cw"
            />
            <span className="text-[18px] text-primary tracking-[-0.03em] font-bold">
              Breathe<span className="text-secondary font-semibold italic">Route</span>
            </span>
          </button>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => go(l.id)}
                className="text-[14px] font-semibold text-on-surface-variant hover:text-[#14532d] transition-colors"
              >
                {l.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#14532d] hover:text-[#166534]"
            >
              Back to top
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-xs pt-space-md border-t border-[#a7f3d0]/40">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Clean commute geospatial intelligence
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            © 2026 BreatheRoute Ecosystems
          </span>
        </div>
      </div>
    </footer>
  );
}
