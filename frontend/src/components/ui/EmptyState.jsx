// src/components/ui/EmptyState.jsx
// ------------------------------------------------------------------
// Clean editorial empty state component.
// Features: centered icon container, bold headline, helpful description,
// and primary/secondary action buttons.
// ------------------------------------------------------------------

import React from 'react';
import Card from './Card';
import Button from './Button';

export default function EmptyState({
  icon = 'inbox',
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  action,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) {
  return (
    <Card
      variant="default"
      p="lg"
      className={`max-w-md w-full mx-auto text-center flex flex-col items-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#15803d] flex items-center justify-center mb-5 shadow-xs">
        <span className="material-symbols-outlined text-[32px] select-none">
          {icon}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
        {action || (
          actionText && onAction && (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )
        )}

        {secondaryActionText && onSecondaryAction && (
          <Button variant="secondary" onClick={onSecondaryAction}>
            {secondaryActionText}
          </Button>
        )}
      </div>
    </Card>
  );
}
