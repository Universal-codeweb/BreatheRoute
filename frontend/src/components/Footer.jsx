// src/components/Footer.jsx
// ------------------------------------------------------------------
// BreatheRoute footer containing the animated marquee wordmark.
// ------------------------------------------------------------------

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-transparent mt-auto pb-4 no-print overflow-hidden relative">
      {/* Animated Large Faded "BreatheRoute" Wordmark across the bottom */}
      <div
        className="w-full overflow-hidden select-none pointer-events-none mt-4 sm:mt-6 flex justify-center text-center"
        aria-hidden="true"
      >
        <div className="animate-marquee whitespace-nowrap flex gap-12">
          <span className="font-black tracking-tighter text-slate-900/[0.055] text-[15vw] sm:text-[12vw] leading-none whitespace-nowrap block select-none uppercase">
            BreatheRoute · Clean Air Commute · Living Corridors ·
          </span>
          <span className="font-black tracking-tighter text-slate-900/[0.055] text-[15vw] sm:text-[12vw] leading-none whitespace-nowrap block select-none uppercase">
            BreatheRoute · Clean Air Commute · Living Corridors ·
          </span>
        </div>
      </div>
    </footer>
  );
}
