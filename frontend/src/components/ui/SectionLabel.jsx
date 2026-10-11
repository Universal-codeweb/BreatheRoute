// src/components/ui/SectionLabel.jsx
// ------------------------------------------------------------------
// Section tag / label component.
// Styles:
// - numbered: "01 / Plan"
// - bracket: "[ Live air quality ]"
// - pill: small rounded pill with optional dot
// ------------------------------------------------------------------

import React from 'react';

export default function SectionLabel({
  number = null,
  label,
  type = 'numbered',
  accent = 'green',
  className = '',
}) {
  const accentText =
    accent === 'white'
      ? 'text-white/80'
      : accent === 'muted'
      ? 'text-slate-500'
      : 'text-[#15803d]';

  const accentNum =
    accent === 'white'
      ? 'text-[#6ee7b7]'
      : accent === 'muted'
      ? 'text-slate-400'
      : 'text-[#16a34a] font-bold';

  if (type === 'bracket') {
    return (
      <span
        className={`inline-flex items-center text-[11px] font-mono tracking-widest uppercase font-semibold select-none ${accentText} ${className}`}
      >
        <span className="opacity-50 mr-1">[</span>
        <span>{label}</span>
        <span className="opacity-50 ml-1">]</span>
      </span>
    );
  }

  if (type === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ecfdf5] border border-[#a7f3d0] text-[#166534] select-none ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
        <span>{label}</span>
      </span>
    );
  }

  // Default: numbered (e.g. "01 / Plan")
  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase select-none ${className}`}
    >
      {number && (
        <>
          <span className={accentNum}>{number}</span>
          <span className="text-slate-300 font-light">/</span>
        </>
      )}
      <span className={`font-semibold tracking-widest ${accentText}`}>
        {label}
      </span>
    </div>
  );
}
