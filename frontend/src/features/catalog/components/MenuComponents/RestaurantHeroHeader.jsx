import React from 'react';
import { Star, Clock, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export default function RestaurantHeroHeader({ restaurant }) {
  if (!restaurant) return null;

  const rating = restaurant.averageRating
    ? parseFloat(restaurant.averageRating).toFixed(1)
    : '4.6';
  const totalRatings = restaurant.totalRatings || '2,400+';
  const eta = restaurant.deliveryTimeMins || '25-30';
  const costForTwo = restaurant.costForTwo ? `₹${restaurant.costForTwo}` : '₹600';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      {/* Top Banner / Cover */}
      <div className="relative h-48 md:h-64 w-full bg-slate-900 overflow-hidden">
        <img
          src={
            restaurant.imageUrl ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
          }
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold shadow-md flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zomatwo Verified</span>
          </span>
        </div>
      </div>

      {/* Restaurant Details Body */}
      <div className="p-6 md:p-8 bg-white space-y-5 border-t border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-heading">
              {restaurant.name}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {restaurant.cuisineTypes || 'North Indian, Mughlai, Biryani'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{restaurant.address || `${restaurant.area || 'Kharadi'}, Pune`}</span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3">
            {/* Rating Box */}
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-700 font-extrabold text-base">
                <span>{rating}</span>
                <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              </div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                {totalRatings}
              </div>
            </div>

            {/* Delivery Time */}
            <div className="px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-700 font-extrabold text-base">
                <Clock className="w-4 h-4" />
                <span>{eta}m</span>
              </div>
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Delivery Time
              </div>
            </div>

            {/* Cost For Two */}
            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center hidden sm:block">
              <div className="text-amber-800 font-extrabold text-base">
                {costForTwo}
              </div>
              <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                For Two
              </div>
            </div>
          </div>
        </div>

        {/* Promo Offer Strip */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 flex items-center justify-between text-xs text-slate-700 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
              %
            </span>
            <span>
              Flat <strong className="text-brand-500 font-bold">20% OFF</strong> up to ₹120 on orders above ₹399
            </span>
          </div>
          <span className="text-[11px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded border border-brand-200">
            Use code: FEAST100
          </span>
        </div>
      </div>
    </div>
  );
}
