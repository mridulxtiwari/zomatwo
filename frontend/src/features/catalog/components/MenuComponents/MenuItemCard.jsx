import React from 'react';
import { Star, Plus } from 'lucide-react';
import { useCartStore } from '../../../cart/stores/useCartStore';
import QuantityStepper from '../../../cart/components/QuantityStepper';

export default function MenuItemCard({ item, restaurant }) {
  const { addItem, incrementItem, decrementItem, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(item.id);

  const handleAdd = () => {
    addItem(restaurant, item);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4">
      {/* Left Details */}
      <div className="flex-1 space-y-1.5">
        {/* Indicators */}
        <div className="flex items-center gap-2">
          {/* Veg / Non-Veg Indicator */}
          <span
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              item.isVeg
                ? 'border-emerald-600 text-emerald-600'
                : 'border-rose-600 text-rose-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>

          {item.isBestseller && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold tracking-wide uppercase border border-amber-200">
              ⭐ Bestseller
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-bold text-base text-slate-900 font-heading">
          {item.name}
        </h4>

        {/* Price */}
        <div className="text-sm font-extrabold text-slate-800">
          ₹{item.price}
        </div>

        {/* Rating if present */}
        {item.rating && (
          <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
            <span>{item.rating}</span>
            <span className="text-slate-400 font-normal">({item.reviewCount || 45})</span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
          {item.description || 'Prepared fresh with signature authentic spices and rich ingredients.'}
        </p>
      </div>

      {/* Right Image + Add / Stepper Button Container */}
      <div className="relative w-28 sm:w-36 h-28 sm:h-32 shrink-0 flex flex-col items-center">
        <img
          src={
            item.imageUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'
          }
          alt={item.name}
          className="w-full h-24 sm:h-28 rounded-2xl object-cover shadow-inner"
        />

        {/* Stepper / Add Button Placed at Bottom Overlap */}
        <div className="absolute -bottom-2 z-10">
          {quantity > 0 ? (
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => incrementItem(item.id)}
              onDecrement={() => decrementItem(item.id)}
              size="md"
            />
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="px-6 py-1.5 rounded-lg bg-white border border-brand-500 text-brand-500 hover:bg-brand-50 font-extrabold text-xs uppercase shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
