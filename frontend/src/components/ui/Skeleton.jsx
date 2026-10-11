// src/components/ui/Skeleton.jsx
// ------------------------------------------------------------------
// Shimmer loading block for asynchronous data fetching.
// Prevents layout jumps while routes or telemetry load.
// Respects prefers-reduced-motion via CSS.
// ------------------------------------------------------------------

import React from 'react';

export default function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
  lines = 1,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'text':
        return 'rounded-md h-4 w-full';
      case 'card':
        return 'rounded-2xl h-36 w-full';
      case 'rect':
      default:
        return 'rounded-xl w-full';
    }
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`flex flex-col gap-2.5 w-full ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{ width: i === lines - 1 ? '70%' : '100%', height: height || '16px' }}
            className="relative overflow-hidden rounded-md bg-slate-200/70"
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer shimmer-gradient" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-200/70 ${getVariantStyles()} ${className}`}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer shimmer-gradient" />
    </div>
  );
}
