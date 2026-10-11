// src/components/ui/useCountUp.js
// ------------------------------------------------------------------
// Hook for counting up numbers smoothly (600ms default).
// Automatically skips animation if user prefers reduced motion.
// ------------------------------------------------------------------

import { useState, useEffect } from 'react';

export function useCountUp(targetValue, duration = 600) {
  const numericTarget = typeof targetValue === 'number' ? targetValue : parseInt(targetValue, 10);
  const isValid = !isNaN(numericTarget);

  const [count, setCount] = useState(() => {
    if (!isValid) return targetValue;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReducedMotion ? numericTarget : 0;
  });

  useEffect(() => {
    if (!isValid) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * numericTarget));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [numericTarget, duration, isValid]);

  return isValid ? count : targetValue;
}

export default useCountUp;
