import React from 'react';
import { Search } from 'lucide-react';

export default function StickyCategoryTabs({
  categories = [],
  activeCategory,
  onSelectCategory,
  vegOnly,
  onToggleVegOnly,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="sticky top-18 z-30 bg-white/95 backdrop-blur-md border-y border-slate-100 shadow-sm py-3 px-4 rounded-2xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Filter Controls: Search inside menu & Veg Only Toggle */}
        <div className="flex items-center gap-3">
          {/* Veg Only Toggle */}
          <button
            type="button"
            onClick={onToggleVegOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                vegOnly ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span>Veg Only</span>
          </button>

          {/* Dish Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search in menu..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
