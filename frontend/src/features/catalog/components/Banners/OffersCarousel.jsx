import React, { useState, useEffect, useRef } from 'react';
import {
  Tag,
  Percent,
  Flame,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Gift,
  Clock,
} from 'lucide-react';

const OFFERS = [
  {
    id: 'offer-1',
    badge: 'NEW USER SPECIAL',
    title: 'FLAT 50% OFF',
    subtitle: 'On your first 3 food deliveries across Pune',
    code: 'WELCOME50',
    discount: '50% OFF',
    maxDiscount: 'Up to ₹150',
    minOrder: 'Min order ₹199',
    gradient: 'from-rose-600 via-pink-600 to-rose-700',
    accentColor: 'text-rose-100',
    badgeBg: 'bg-rose-950/40 text-rose-200 border-rose-400/30',
    icon: Flame,
    filterAction: 'FLAT',
    category: 'All Restaurants',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=80',
    imageBadge: '🔥 Gourmet Burgers',
    imageAlt: 'Gourmet Double Smash Burger and Fries',
  },
  {
    id: 'offer-2',
    badge: 'WEEKEND SPECIAL',
    title: 'UP TO ₹125 OFF',
    subtitle: 'Royal Dum Biryanis from Behrouz, Biryani Blues & more',
    code: 'BIRYANI125',
    discount: '₹125 OFF',
    maxDiscount: 'Flat discount',
    minOrder: 'Min order ₹349',
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    accentColor: 'text-amber-100',
    badgeBg: 'bg-amber-950/40 text-amber-200 border-amber-400/30',
    icon: Sparkles,
    filterAction: 'Biryani',
    category: 'Biryani Fest',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80',
    imageBadge: '👑 Royal Handi Dum',
    imageAlt: 'Authentic Hyderabadi Dum Biryani with Saffron',
  },
  {
    id: 'offer-3',
    badge: 'TRENDING BINGE',
    title: 'BUY 1 GET 1 FREE',
    subtitle: 'Handcrafted sourdough pizzas, smash burgers & wings',
    code: 'BOGOFEAST',
    discount: 'BOGO FREE',
    maxDiscount: 'Select items',
    minOrder: 'No min order',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    accentColor: 'text-indigo-100',
    badgeBg: 'bg-indigo-950/40 text-indigo-200 border-indigo-400/30',
    icon: Gift,
    filterAction: 'BUY 1 GET 1',
    category: 'Pizzas & Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&q=80',
    imageBadge: '🍕 Artisanal Wood-Fired',
    imageAlt: 'Wood Fired Neapolitan Pizza with Fresh Basil',
  },
  {
    id: 'offer-4',
    badge: 'LIGHTNING SAVINGS',
    title: 'FREE DELIVERY',
    subtitle: 'Zero delivery charges on all meals delivered in under 25 mins',
    code: 'FREEDEL25',
    discount: '100% FREE',
    maxDiscount: 'Delivery fee waived',
    minOrder: 'Min order ₹149',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: 'text-emerald-100',
    badgeBg: 'bg-emerald-950/40 text-emerald-200 border-emerald-400/30',
    icon: Clock,
    filterAction: 'FREE DELIVERY',
    category: 'Fast Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700&q=80',
    imageBadge: '⚡ Express in 22 mins',
    imageAlt: 'Asian Wok Noodles and Dim Sum Bowl',
  },
  {
    id: 'offer-5',
    badge: 'AFTER HOURS DELIGHT',
    title: 'FLAT ₹80 OFF',
    subtitle: 'Late night cravings, decadent desserts, waffles & shakes',
    code: 'NIGHT80',
    discount: '₹80 OFF',
    maxDiscount: 'On desserts & snacks',
    minOrder: 'Min order ₹249',
    gradient: 'from-violet-700 via-purple-700 to-fuchsia-700',
    accentColor: 'text-purple-100',
    badgeBg: 'bg-purple-950/40 text-purple-200 border-purple-400/30',
    icon: Tag,
    filterAction: 'Desserts',
    category: 'Desserts & Shakes',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=700&q=80',
    imageBadge: '🍫 Decadent Sweets',
    imageAlt: 'Belgian Waffle with Chocolate and Berries',
  },
];

export default function OffersCarousel({ onSelectOffer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  // Auto-slide every 5 seconds when not hovering
  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % OFFERS.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? OFFERS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % OFFERS.length);
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activeOffer = OFFERS[currentIndex];
  const IconComponent = activeOffer.icon;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-lg select-none transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Banner with Dynamic Gradient */}
      <div
        className={`relative w-full bg-gradient-to-r ${activeOffer.gradient} text-white p-4 sm:p-7 md:p-9 transition-all duration-500`}
      >
        {/* Ambient Decorative Blur Orbs */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-12 w-60 h-60 bg-black/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row: Category Badge */}
        <div className="relative z-10 flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border backdrop-blur-md shadow-xs ${activeOffer.badgeBg}`}
            >
              {activeOffer.badge}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <IconComponent className="w-3.5 h-3.5 text-white" />
              <span>{activeOffer.category}</span>
            </span>
          </div>
        </div>

        {/* Main Body: Content & Interactive Food Image Showcase */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left Column (Offer Headline, Details, and Actions) */}
          <div className="md:col-span-7 lg:col-span-8 space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-heading tracking-tight text-white drop-shadow-sm flex flex-wrap items-center gap-2 sm:gap-2.5">
                <span>{activeOffer.title}</span>
                <span className="text-xs sm:text-sm font-black bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/30 text-white shadow-2xs">
                  {activeOffer.discount}
                </span>
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-white/95 font-medium leading-relaxed max-w-lg">
                {activeOffer.subtitle}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-white/80 font-semibold pt-1">
                <span>• {activeOffer.minOrder}</span>
                <span>• {activeOffer.maxDiscount}</span>
              </div>
            </div>

            {/* Action Buttons: Coupon Code & Claim Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Promo Code Pill with Copy Action */}
              <button
                type="button"
                onClick={(e) => handleCopyCode(activeOffer.code, e)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/30 backdrop-blur-md text-white text-xs font-bold transition-all shadow-xs cursor-pointer group/copy"
                title="Click to copy coupon code"
              >
                <Tag className="w-3.5 h-3.5 text-white/90 group-hover/copy:rotate-12 transition-transform" />
                <span>Use: {activeOffer.code}</span>
                {copiedCode === activeOffer.code ? (
                  <span className="flex items-center gap-1 text-emerald-300 text-[10px] uppercase font-black animate-scale-up">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                ) : (
                  <Copy className="w-3 h-3 text-white/70 group-hover/copy:text-white" />
                )}
              </button>

              {/* Direct Claim Offer Button */}
              <button
                type="button"
                onClick={() => onSelectOffer?.(activeOffer)}
                className="px-5 py-2 rounded-xl bg-white hover:bg-white/95 text-slate-900 text-xs sm:text-sm font-extrabold shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Deals</span>
                <ArrowRight className="w-4 h-4 text-brand-500" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Food Image Presentation */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 justify-end">
            <div
              onClick={() => onSelectOffer?.(activeOffer)}
              className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 group/img cursor-pointer transform hover:scale-[1.03] transition-all duration-300 w-full max-w-[260px] lg:max-w-[290px] aspect-[4/3] bg-black/20"
              title={`View ${activeOffer.title} deals`}
            >
              <img
                src={activeOffer.imageUrl}
                alt={activeOffer.imageAlt}
                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Pill on Image */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-xs">
                  {activeOffer.imageBadge}
                </span>
                <span className="p-1 rounded-full bg-white/20 backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Centered Pagination Dots Indicator (Below Center) */}
        <div className="relative z-10 flex justify-center items-center mt-5">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-inner border border-white/10">
            {OFFERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Floating Left / Right Chevron Navigation Buttons */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-md"
          title="Previous Offer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-md"
          title="Next Offer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
