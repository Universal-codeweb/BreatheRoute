// src/components/ui/ErrorState.jsx
// ------------------------------------------------------------------
// Clean editorial error state component with retry button.
// Uses gentle warm alert tones rather than harsh red walls.
// ------------------------------------------------------------------

import React from 'react';
import Card from './Card';
import Button from './Button';

export default function ErrorState({
  icon = 'warning',
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please check your connection and try again.',
  onRetry,
  retryText = 'Try again',
  className = '',
}) {
  return (
    <Card
      variant="default"
      p="lg"
      className={`max-w-md w-full mx-auto text-center flex flex-col items-center border-red-200 bg-red-50/40 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[30px] select-none">
          {icon}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-sm">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          icon="refresh"
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
        >
          {retryText}
        </Button>
      )}
    </Card>
  );
}
