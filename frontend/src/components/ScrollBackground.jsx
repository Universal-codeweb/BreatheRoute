// src/components/ScrollBackground.jsx
// ------------------------------------------------------------------
// Scroll-driven background layer.
// Transitions from healthy clear skies to polluted smoggy skyline
// based on window scroll progress.
// ------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import cloudVideo from '../assets/cloud-moving.mp4';
import healthyImg from '../assets/healthy.jpg';
import pollutedImg from '../assets/polluted.jpg';

export default function ScrollBackground({ progress: controlledProgress }) {
  // Internal progress state (0 = healthy, 1 = polluted)
  const [internalProgress, setInternalProgress] = useState(0);

  // Use controlled progress prop if supplied, otherwise use internal scroll progress
  const progress = controlledProgress !== undefined ? controlledProgress : internalProgress;

  // Passive scroll listener to calculate progress
  useEffect(() => {
    if (controlledProgress !== undefined) return;

    const handleScroll = () => {
      // Transition spans 1.5 screen heights of scroll
      const p = Math.min(window.scrollY / (window.innerHeight * 1.5), 1);
      setInternalProgress(p);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controlledProgress]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
      {/* Fallback image */}
      <img
        src={healthyImg}
        alt="Healthy nature with clear blue sky"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Looping moving clouds background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={cloudVideo} type="video/mp4" />
        <source src="/cloud-moving.mp4" type="video/mp4" />
      </video>

      {/* Top image: Polluted world, opacity tied to scroll progress */}
      <img
        src={pollutedImg}
        alt="Polluted industrial smog and smoke"
        style={{ opacity: progress }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ease-out"
      />

      {/* Grey smog overlay (opacity = progress * 0.35) */}
      <div
        style={{ opacity: progress * 0.35 }}
        className="absolute inset-0 bg-[#52525b] transition-opacity duration-150 ease-out"
      />
    </div>
  );
}
