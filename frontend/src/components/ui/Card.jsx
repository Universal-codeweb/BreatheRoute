// src/components/ui/Card.jsx
// ------------------------------------------------------------------
// Base surface component with variants:
// - default: clean white card with subtle green-tinted border
// - glass: semi-translucent backdrop-blur for floating overlays
// - highlight: soft mint-accented surface for callouts & recommendations
// Supports interactive hover lift (2px lift, softer shadow, 150ms).
// ------------------------------------------------------------------

import React from 'react';

const VARIANT_STYLES = {
  default:
    'bg-white border border-[#e6f4ea] shadow-soft text-on-surface',
  glass:
    'bg-white/80 backdrop-blur-md border border-white/60 shadow-glass text-on-surface',
  highlight:
    'bg-[#f0fdf4] border border-[#bbf7d0] shadow-soft text-on-surface',
  muted:
    'bg-[#f8faf9] border border-[#e5e7eb] shadow-none text-on-surface',
};

const PADDING_STYLES = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function Card({
  children,
  variant = 'default',
  p = 'md',
  interactive = false,
  className = '',
  as: Component = 'div',
  ...props
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const paddingClass = PADDING_STYLES[p] ?? PADDING_STYLES.md;
  const interactiveClass = interactive ? 'card-hover-lift cursor-pointer' : '';

  return (
    <Component
      className={`rounded-2xl ${variantClass} ${paddingClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
