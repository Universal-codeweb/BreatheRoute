// src/components/ui/Badge.jsx
// ------------------------------------------------------------------
// General purpose badge / pill component.
// ------------------------------------------------------------------

import React from 'react';

const VARIANT_STYLES = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  mint: 'bg-[#ecfdf5] text-[#166534] border-[#a7f3d0]',
  outline: 'bg-transparent text-slate-700 border-slate-300',
  dark: 'bg-[#0b1c30] text-white border-transparent',
};

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon = null,
  className = '',
  ...props
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && (
        <span className="material-symbols-outlined text-[13px] leading-none select-none">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
