// src/components/BackgroundVideo.jsx
// ------------------------------------------------------------------
// High-performance looping moving clouds background video.
// Plays seamlessly behind all pages with zero interaction interference.
// ------------------------------------------------------------------

import React from 'react';
import cloudVideo from '../assets/cloud-moving.mp4';

export default function BackgroundVideo() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-30 pointer-events-none overflow-hidden select-none"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={cloudVideo} type="video/mp4" />
        <source src="/cloud-moving.mp4" type="video/mp4" />
      </video>
      {/* Light soft translucent overlay to ensure crisp contrast & readability */}
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[0.5px]" />
    </div>
  );
}
