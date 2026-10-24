import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Trash2, Utensils } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import QuantityStepper from './QuantityStepper';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    restaurant,
    items,
    incrementItem,
    decrementItem,
    clearCart,
    getSubtotal,
    getTotalItemsCount,
  } = useCartStore();

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 499 || items.length === 0 ? 0 : 35;
  const platformFee = items.length > 0 ? 6 : 0;
  const taxesAndCharges = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + platformFee + taxesAndCharges;

  const handleProceed = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 font-heading text-lg">
                Your Order
              </h3>
              <p className="text-xs text-slate-500">
                {items.length > 0
                  ? `${getTotalItemsCount()} items from ${restaurant?.name}`
                  : 'No items yet'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Utensils className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 font-heading">
                  Your cart is empty
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Good food is always cooking! Explore top restaurants and satisfy your cravings.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Restaurant info card */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 font-heading">
                    {restaurant?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{restaurant?.area} • Fast Delivery</p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4 divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Veg / Non-Veg symbol */}
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          item.isVeg
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-rose-600 text-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium">
                          ₹{item.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <QuantityStepper
                        quantity={item.quantity}
                        onIncrement={() => incrementItem(item.id)}
                        onDecrement={() => decrementItem(item.id)}
                        size="sm"
                      />
                      <span className="text-xs font-bold text-slate-900 min-w-[50px] text-right tabular-nums">
                        ₹{Number(item.price) * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Bill Summary
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-slate-900'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-slate-900">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes & Restaurant Charges (5%)</span>
                  <span className="font-semibold text-slate-900">₹{taxesAndCharges}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>To Pay</span>
                  <span className="text-brand-500">₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="text-left">
                <div className="text-[11px] text-white/80 uppercase font-semibold">
                  {getTotalItemsCount()} {getTotalItemsCount() === 1 ? 'item' : 'items'}
                </div>
                <div className="text-base font-extrabold">₹{grandTotal}</div>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
