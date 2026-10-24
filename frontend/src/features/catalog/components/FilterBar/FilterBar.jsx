import React from 'react';
import { LayoutGrid, Map, Star, Zap, Percent, Check } from 'lucide-react';

export default function FilterBar({
  pureVeg,
  onTogglePureVeg,
  rating4Plus,
  onToggleRating4Plus,
  fastDelivery,
  onToggleFastDelivery,
  offersOnly,
  onToggleOffersOnly,
  viewMode,
  onChangeViewMode,
  totalResults = 0,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-y border-slate-100">
      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* Pure Veg Toggle */}
        <button
          type="button"
          onClick={onTogglePureVeg}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            pureVeg
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${pureVeg ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span>Pure Veg</span>
          {pureVeg && <Check className="w-3.5 h-3.5 text-emerald-600" />}
        </button>

        {/* 4.0+ Rating */}
        <button
          type="button"
          onClick={onToggleRating4Plus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            rating4Plus
              ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${rating4Plus ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
          <span>Rating 4.0+</span>
        </button>

        {/* Fast Delivery */}
        <button
          type="button"
          onClick={onToggleFastDelivery}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            fastDelivery
              ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-blue-500" />
          <span>Fast Delivery &lt;25m</span>
        </button>

        {/* Offers */}
        <button
          type="button"
          onClick={onToggleOffersOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            offersOnly
              ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-rose-500" />
          <span>Great Offers</span>
        </button>
      </div>

      {/* View Switcher: Grid vs Map */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={() => onChangeViewMode('grid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'grid'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'map'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Map View 🗺️</span>
        </button>
      </div>
    </div>
  );
}
