// src/components/Footer.jsx
// ------------------------------------------------------------------
// BreatheRoute Footer aligned with Stitch high-tech ecology design.
// ------------------------------------------------------------------

import React from 'react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="w-full bg-surface-container-low mt-space-2xl py-space-xl border-t border-[#a7f3d0]/40 shadow-[0_-1px_6px_rgba(15,61,42,0.03)]">
      <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-space-xs text-left group cursor-pointer focus-visible:outline-none"
          >
            <img
              alt="BreatheRoute Logo"
              className="h-7 w-7 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBspYAOaDLHofmuwl_UkxFLbBYtDNjNf5X9ysEnCk9fM_RFMrA-iBfE1_ICpdfEUH5xOOk_guGth_qC_mbfZA_9eSFijaLhpr4MezX_uYR7hiaSGiAztB1l0XuupqVFIWNpPHVhst0zNVGGaN8yt0yZ4gre2UvN3OLVKkb4d-4h2SF_r9aDgcCUeDECb2T6FwlCRQsSR5rR5iEkz7ik8-szo7j8PmG0l5rq5AbSSKcSVK1bSaE41M3yqpJjCNEZePu1Cw"
            />
            <span
              className="text-[18px] text-primary tracking-[-0.03em] font-bold"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Breathe<span className="text-secondary font-semibold italic">Route</span>
            </span>
          </button>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            • Clean Commute Geospatial Intelligence
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-space-lg">
          <span className="font-data-badge text-data-badge text-on-surface-variant">
            Atmospheric Model: EPA-AQI / Real-Time Micro-Sensors
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            © 2026 BreatheRoute Ecosystems
          </span>
        </div>
      </div>
    </footer>
  );
}