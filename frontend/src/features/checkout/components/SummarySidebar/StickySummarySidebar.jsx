import React, { useState } from 'react';
import { Tag, ShieldAlert, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';
import { useCartStore } from '../../../cart/stores/useCartStore';
import QuantityStepper from '../../../cart/components/QuantityStepper';

const SUGGESTED_COUPONS = [
  { code: 'WELCOME50', desc: '50% OFF up to ₹150' },
  { code: 'FEAST100', desc: '20% OFF up to ₹120' },
  { code: 'MEGA100', desc: 'Flat ₹100 OFF' },
];

export default function StickySummarySidebar({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  isPlacingOrder,
}) {
  const {
    restaurant,
    items,
    incrementItem,
    decrementItem,
    getSubtotal,
    getTotalItemsCount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const subtotal = getSubtotal();
  const deliveryFee = subtotal >= 499 || items.length === 0 ? 0 : 35;
  const platformFee = items.length > 0 ? 6 : 0;
  const taxesAndCharges = Math.round(subtotal * 0.05);

  let discount = 0;
  if (appliedCoupon === 'WELCOME50') {
    discount = Math.min(Math.round(subtotal * 0.5), 150);
  } else if (appliedCoupon === 'FEAST100') {
    discount = Math.min(Math.round(subtotal * 0.2), 120);
  } else if (appliedCoupon === 'MEGA100') {
    discount = 100;
  }

  const grandTotal = Math.max(0, subtotal - discount + deliveryFee + platformFee + taxesAndCharges);

  const handleApply = (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code) return;
    onApplyCoupon(code.toUpperCase());
    setCouponInput('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
      {/* Restaurant Header */}
      <div className="border-b border-slate-100 pb-4">
        <h4 className="font-extrabold text-base text-slate-900 font-heading">
          {restaurant?.name || 'Restaurant Order'}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">{restaurant?.area || 'Kharadi, Pune'}</p>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className="font-semibold text-slate-800 truncate">{item.name}</span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <QuantityStepper
                quantity={item.quantity}
                onIncrement={() => incrementItem(item.id)}
                onDecrement={() => decrementItem(item.id)}
                size="sm"
              />
              <span className="font-bold text-slate-900 min-w-[45px] text-right">
                ₹{Number(item.price) * item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Application Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-500" />
            <span>Apply Coupon</span>
          </span>
          {appliedCoupon && (
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600"
            >
              Remove
            </button>
          )}
        </div>

        {appliedCoupon ? (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>'{appliedCoupon}'</strong> applied (-₹{discount})
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => handleApply()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Quick coupon suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_COUPONS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleApply(c.code)}
                  className="px-2 py-0.5 rounded-md border border-brand-200 bg-brand-50 text-[10px] font-bold text-brand-600 hover:bg-brand-100 transition-colors"
                >
                  {c.code}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Itemized Bill Details */}
      <div className="space-y-2 text-xs border-t border-slate-100 pt-4 text-slate-600">
        <div className="flex justify-between">
          <span>Item Total</span>
          <span className="font-semibold text-slate-900">₹{subtotal}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Coupon Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Delivery Partner Fee</span>
          <span className={deliveryFee === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-slate-900'}>
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Platform Fee</span>
          <span className="font-semibold text-slate-900">₹{platformFee}</span>
        </div>

        <div className="flex justify-between">
          <span>Govt Taxes & Restaurant Charges (5%)</span>
          <span className="font-semibold text-slate-900">₹{taxesAndCharges}</span>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-slate-900 font-extrabold text-base">
          <span>To Pay</span>
          <span className="text-brand-500 font-heading text-lg">₹{grandTotal}</span>
        </div>
      </div>

      {/* Cancellation Policy Badge */}
      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-800">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong>Review order details carefully:</strong> Orders cannot be cancelled once food preparation begins at the restaurant kitchen.
        </p>
      </div>

      {/* Primary Place Order CTA Button */}
      <button
        type="button"
        disabled={isPlacingOrder || items.length === 0}
        onClick={onPlaceOrder}
        className="w-full py-4 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-between group active:scale-[0.99]"
      >
        <span>Place Order & Pay</span>
        <div className="flex items-center gap-1.5 font-bold">
          <span>₹{grandTotal}</span>
          {isPlacingOrder ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          )}
        </div>
      </button>
    </div>
  );
}
