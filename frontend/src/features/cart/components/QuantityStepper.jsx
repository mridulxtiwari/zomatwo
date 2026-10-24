import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-7 text-xs px-2 gap-2 min-w-[72px]',
    md: 'h-8 text-sm px-2.5 gap-2.5 min-w-[88px]',
    lg: 'h-10 text-base px-3 gap-3 min-w-[104px]',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`inline-flex items-center justify-between rounded-lg bg-white border border-brand-500 font-bold text-brand-500 shadow-sm transition-all select-none ${sizeClasses[size]}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        className="text-brand-500 hover:text-brand-600 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Decrease quantity"
      >
        <Minus className={iconSizes[size]} />
      </button>

      <span className="font-extrabold text-slate-800 tabular-nums">
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className="text-brand-500 hover:text-brand-600 hover:scale-110 active:scale-95 transition-transform"
        aria-label="Increase quantity"
      >
        <Plus className={iconSizes[size]} />
      </button>
    </div>
  );
}
