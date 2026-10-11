// src/components/ui/CountUp.jsx
// ------------------------------------------------------------------
// Animated number counter component for AQI numbers & telemetry.
// ------------------------------------------------------------------

import React from 'react';
import { useCountUp } from './useCountUp';

export default function CountUp({ value, duration = 600, className = '', prefix = '', suffix = '' }) {
  const animatedValue = useCountUp(value, duration);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {animatedValue}
      {suffix}
    </span>
  );
}
