import React, { useState } from 'react';
import { Crown, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function GoldPrivilegeBanner() {
  const [isJoined, setIsJoined] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-5 md:p-6 shadow-lg border border-amber-500/20">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-bold text-amber-300 font-heading tracking-wide">
                Zomatwo Gold
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                {isJoined ? 'ACTIVE MEMBER' : 'VIP MEMBERSHIP'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-0.5">
              {isJoined
                ? 'Unlimited Free Delivery & 20% discount unlocked on all orders across Pune!'
                : 'Unlimited Free Delivery on orders above ₹199 + Extra 20% OFF on 1,000+ top restaurants.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsJoined(!isJoined)}
          className={`self-start sm:self-auto px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
            isJoined
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-105'
          }`}
        >
          {isJoined ? (
            <>
              <Check className="w-4 h-4" />
              <span>Gold Activated</span>
            </>
          ) : (
            <>
              <span>Join for ₹49</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      <div className="absolute right-0 top-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
