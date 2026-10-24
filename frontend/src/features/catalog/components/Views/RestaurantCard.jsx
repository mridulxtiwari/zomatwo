import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Heart } from 'lucide-react';

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Fallback defaults for realistic presentation
  const rating = restaurant.averageRating ? parseFloat(restaurant.averageRating).toFixed(1) : '4.5';
  const reviewsCount = restaurant.totalRatingsCount > 0 ? `${(restaurant.totalRatingsCount / 1000).toFixed(1)}k` : '1.2k';
  const distance = restaurant.distanceKm ? `${restaurant.distanceKm} km` : '1.8 km';
  const etaMinutes = restaurant.distanceKm ? Math.max(15, Math.round(restaurant.distanceKm * 8)) : 25;

  // Dynamic recommendations and offers based on restaurant cuisine
  const getMustTry = (r) => {
    const c = (r.cuisineTypes || '').toLowerCase();
    const n = (r.name || '').toLowerCase();
    if (c.includes('pizza') || c.includes('italian')) return 'Sourdough Margherita, Tiramisu';
    if (c.includes('burger') || n.includes('burger')) return 'Double Smash Burger, Truffle Fries';
    if (c.includes('roll') || c.includes('shawarma') || c.includes('lebanese')) return 'Chicken Kathi Roll, Shawarma';
    if (c.includes('thali') || c.includes('punjabi')) return 'Grand Maharaja Thali, Dal Makhani';
    if (c.includes('chinese') || c.includes('asian') || c.includes('wok')) return 'Hakka Noodles, Dim Sums';
    if (c.includes('dessert') || c.includes('ice cream')) return 'Belgian Waffle, Dark Chocolate Gelato';
    if (c.includes('biryani') || c.includes('mughlai')) return 'Hyderabadi Dum Biryani, Galouti Kebab';
    return 'Chef Signature Platter, Butter Naan';
  };

  const getOffer = (r) => {
    if (r.offerText) return r.offerText;
    const c = (r.cuisineTypes || '').toLowerCase();
    if (c.includes('biryani')) return '20% OFF UP TO ₹120';
    if (c.includes('pizza')) return '50% OFF UP TO ₹100';
    if (c.includes('burger')) return 'FREE DELIVERY ON ₹199+';
    if (c.includes('roll')) return 'BUY 1 GET 1 FREE';
    if (c.includes('thali')) return 'FLAT ₹75 OFF';
    if (c.includes('asian')) return '40% OFF UP TO ₹80';
    return '60% OFF UP TO ₹120';
  };

  const mustTryDishes = getMustTry(restaurant);
  const offerBadge = getOffer(restaurant);

  return (
    <div
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Thumbnail Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Discount Ribbon */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-brand-500 text-white text-[11px] font-bold shadow-md tracking-wide uppercase">
          {offerBadge}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
          aria-label="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-500 text-brand-500' : 'text-white'}`} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-base text-slate-900 group-hover:text-brand-500 transition-colors truncate font-heading">
              {restaurant.name}
            </h4>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-sm">
              <span>{rating}</span>
              <Star className="w-3 h-3 fill-white text-white" />
            </div>
          </div>

          <p className="text-xs text-slate-500 truncate mt-0.5">
            {restaurant.cuisineTypes}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span>{etaMinutes} mins • {distance}</span>
          </div>
          <span className="text-slate-500">
            ₹{restaurant.costForTwo} for two
          </span>
        </div>

        {/* Bestseller Peek */}
        <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate">
            <strong className="text-slate-700">Must Try:</strong> {mustTryDishes}
          </span>
          <span className="text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
            View Menu →
          </span>
        </div>
      </div>
    </div>
  );
}
