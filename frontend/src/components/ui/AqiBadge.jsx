// src/components/ui/AqiBadge.jsx
// ------------------------------------------------------------------
// AQI Status Badge.
// Colors strictly derived from LEVEL_COLORS:
// - clean: #2ECC71 ("Good")
// - moderate: #F1C40F ("Moderate")
// - high: #E67E22 ("High")
// - poor: #E74C3C ("Poor")
// ------------------------------------------------------------------

import React from 'react';
import { LEVEL_COLORS } from '../../utils/colors';
import { useCountUp } from './useCountUp';

function getAqiInfo(aqi) {
  const num = typeof aqi === 'number' ? aqi : parseInt(aqi, 10);
  if (isNaN(num)) {
    return { level: 'clean', label: 'Unknown', color: LEVEL_COLORS.clean };
  }
  if (num <= 50) {
    return { level: 'clean', label: 'Good', color: LEVEL_COLORS.clean };
  }
  if (num <= 100) {
    return { level: 'moderate', label: 'Moderate', color: LEVEL_COLORS.moderate };
  }
  if (num <= 150) {
    return { level: 'high', label: 'High', color: LEVEL_COLORS.high };
  }
  return { level: 'poor', label: 'Poor', color: LEVEL_COLORS.poor };
}

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3.5 py-1.5 text-sm gap-2',
};

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export default function AqiBadge({
  aqi,
  showLabel = true,
  showValue = true,
  animated = false,
  size = 'md',
  className = '',
  pulse = true,
  ...props
}) {
  const num = typeof aqi === 'number' ? aqi : parseInt(aqi, 10);
  const { label, color } = getAqiInfo(num);
  const animatedValue = useCountUp(isNaN(num) ? 0 : num, 600);
  const displayValue = animated ? animatedValue : aqi;

  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  const dotSizeClass = DOT_SIZES[size] || DOT_SIZES.md;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border tabular-nums transition-colors duration-150 ${sizeClass} ${className}`}
      style={{
        backgroundColor: `${color}14`, // 8% opacity tint
        borderColor: `${color}40`,     // 25% opacity border
        color: color === '#F1C40F' ? '#854d0e' : color, // ensure WCAG AA contrast for yellow
      }}
      aria-label={`AQI ${aqi}: ${label}`}
      {...props}
    >
      {/* Pulse dot indicator */}
      <span
        className={`rounded-full flex-shrink-0 ${dotSizeClass} ${pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      {showValue && <span>AQI {displayValue}</span>}
      {showValue && showLabel && <span className="opacity-40">·</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
