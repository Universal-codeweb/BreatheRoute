// src/components/ui/Button.jsx
// ------------------------------------------------------------------
// Button component.
// Variants:
// - primary: filled deep green with white text
// - secondary: clean white surface with mint border & green text
// - ghost: transparent with subtle mint hover
// - danger: soft red error button
// Features: loading state with spinner, min 44px tap target, active press scale (0.98).
// ------------------------------------------------------------------

import React from 'react';

const VARIANT_STYLES = {
  primary:
    'bg-[#15803d] hover:bg-[#166534] text-white shadow-soft hover:shadow-md border border-transparent',
  secondary:
    'bg-white hover:bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] shadow-xs hover:border-[#86efac]',
  ghost:
    'bg-transparent hover:bg-[#dcfce7]/60 text-[#15803d] border border-transparent',
  danger:
    'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-soft border border-transparent',
};

const SIZE_STYLES = {
  sm: 'min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'min-h-[48px] px-6 py-3 text-base font-bold rounded-2xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center select-none transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon &&
        iconPosition === 'left' && (
          <span className="material-symbols-outlined text-[18px] leading-none select-none">
            {icon}
          </span>
        )
      )}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px] leading-none select-none">
          {icon}
        </span>
      )}
    </button>
  );
}
