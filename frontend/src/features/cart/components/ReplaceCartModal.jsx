import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';

export default function ReplaceCartModal() {
  const {
    conflictModalOpen,
    restaurant: currentRestaurant,
    pendingRestaurant,
    confirmReplaceCart,
    cancelReplaceCart,
  } = useCartStore();

  if (!conflictModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-slate-900 font-heading">
            Replace cart items?
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your cart already contains dishes from{' '}
            <strong className="text-slate-900 font-bold">{currentRestaurant?.name}</strong>.
            Would you like to discard the existing cart and add fresh dishes from{' '}
            <strong className="text-brand-500 font-bold">{pendingRestaurant?.name}</strong>?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={cancelReplaceCart}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Keep Existing
          </button>
          <button
            type="button"
            onClick={confirmReplaceCart}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard & Replace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
