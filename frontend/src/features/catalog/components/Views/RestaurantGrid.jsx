import React from 'react';
import RestaurantCard from './RestaurantCard';

export default function RestaurantGrid({ restaurants = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm shimmer-effect space-y-3 p-3">
            <div className="h-44 bg-slate-200 rounded-xl w-full" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <h4 className="text-base font-bold text-slate-800 font-heading">
          No restaurants found in this area
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Try expanding your delivery radius or toggling different cuisine filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
