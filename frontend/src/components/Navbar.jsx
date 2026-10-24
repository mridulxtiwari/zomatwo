import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  MapPin,
  Search,
  User as UserIcon,
  LogOut,
  ChefHat,
  ChevronDown,
  Check,
  Clock,
  Store,
  X,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { useCartStore } from '../features/cart/stores/useCartStore';
import { useLocationStore, PUNE_NEIGHBORHOODS } from '../features/catalog/stores/useLocationStore';

export default function Navbar({ onOpenCart }) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { user, role, isAuthenticated, logout, isRestaurantOwner } = useAuthStore();
  const { getTotalItemsCount, getSubtotal } = useCartStore();
  const { currentLocation, setLocation, searchQuery, setSearchQuery } = useLocationStore();

  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const locationMenuRef = useRef(null);

  const cartCount = getTotalItemsCount();
  const cartSubtotal = getSubtotal();
  const isPartnerPage = location.pathname.startsWith('/partner');

  // Check if there is an active tracked order
  const [activeOrderId, setActiveOrderId] = useState(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zomatwo-current-order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.orderId && parsed?.status !== 'DELIVERED' && parsed?.status !== 'CANCELLED') {
          setActiveOrderId(parsed.orderId);
        }
      }
    } catch {}
  }, [location.pathname]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all w-full">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-3 md:gap-6">
        
        {/* Left: Brand Logo */}
        <div className="shrink-0 flex items-center">
          <Link to="/" className="flex items-center gap-1 group focus:outline-none">
            <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-brand-500 font-heading group-hover:scale-[1.02] transition-transform">
              zomatwo
            </span>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-500 animate-pulse" />
          </Link>
        </div>

        {/* Center: Desktop Unified Omnibar (Visible on md and up) */}
        {!isPartnerPage && (
          <div className="flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl hidden md:flex items-center bg-slate-100/80 hover:bg-slate-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500/30 border border-slate-200/70 rounded-full shadow-inner transition-all h-12 px-4 gap-3">
            
            {/* Interactive Location Dropdown for Desktop */}
            <div className="relative shrink-0" ref={locationMenuRef}>
              <button
                type="button"
                onClick={() => setIsLocationOpen((prev) => !prev)}
                className="flex items-center gap-1.5 py-1 px-2 rounded-full hover:bg-slate-200/60 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                title="Select Delivery Location in Pune"
              >
                <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="truncate max-w-[130px] font-bold text-slate-900">
                  {currentLocation.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Location Menu Dropdown */}
              {isLocationOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Delivery Neighborhood</span>
                    <span className="text-[9px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded-full">Pune</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {PUNE_NEIGHBORHOODS.map((loc) => {
                      const isSelected = currentLocation.name === loc.name;
                      return (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            setLocation(loc);
                            setIsLocationOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 text-brand-600 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                            <span>{loc.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="w-px h-5 bg-slate-300/80 shrink-0" />

            {/* Search Input Field */}
            <div className="flex-1 flex items-center gap-2 relative min-w-0">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, dishes..."
                className="w-full bg-transparent text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none truncate"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Section: Compact on mobile, full on desktop */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* ROLE-BASED: RESTAURANT OWNER ONLY LINK */}
          {isAuthenticated && (isRestaurantOwner() || role === 'ROLE_ADMIN') && (
            <Link
              to="/partner/orders"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                isPartnerPage
                  ? 'bg-slate-900 text-white ring-2 ring-emerald-500/50'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Kitchen Live Terminal"
            >
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span className="hidden sm:inline">Kitchen Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </Link>
          )}

          {/* User Profile / Authentication */}
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-slate-300"
              >
                <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-xs ${
                  isRestaurantOwner() ? 'bg-gradient-to-tr from-emerald-600 to-teal-500' : 'bg-gradient-to-tr from-brand-500 to-rose-600'
                }`}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[85px] truncate hidden sm:inline">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:inline transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isRestaurantOwner()
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-100'
                      }`}>
                        {role === 'ROLE_RESTAURANT_OWNER' ? 'Restaurant Partner' : role === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                    {!isRestaurantOwner() && (
                      <>
                        <Link
                          to="/"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>Explore Restaurants</span>
                        </Link>

                        {activeOrderId && (
                          <Link
                            to={`/orders/${activeOrderId}/track`}
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors font-bold"
                          >
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>Track Active Order</span>
                          </Link>
                        )}
                      </>
                    )}

                    {isRestaurantOwner() && (
                      <>
                        <Link
                          to="/partner/orders"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors font-bold"
                        >
                          <ChefHat className="w-4 h-4 text-emerald-600" />
                          <span>Kitchen Live Terminal</span>
                        </Link>
                        <Link
                          to="/"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          <Store className="w-4 h-4 text-slate-400" />
                          <span>Customer Discovery View</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-500 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500 sm:hidden" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/auth/register"
                className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Cart Drawer Trigger */}
          {!isPartnerPage && (
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title="Open Food Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {cartCount > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">₹{cartSubtotal}</span>
                  <span className="w-1 h-1 rounded-full bg-white/60 hidden sm:inline" />
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-brand-600 text-[10px] sm:text-[11px] font-black shadow-2xs">
                    {cartCount}
                  </span>
                </div>
              ) : (
                <span className="hidden sm:inline">Cart</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Row 2 on Mobile: Unified Location & Search Omnibar */}
      {!isPartnerPage && (
        <div className="md:hidden px-4 pb-2.5 pt-0.5">
          <div className="flex items-center bg-slate-100/90 rounded-full px-2.5 py-1.5 border border-slate-200/80 shadow-inner gap-2">
            
            {/* Mobile Location Picker */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsLocationOpen((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-800 py-0.5 px-1.5 rounded-full hover:bg-slate-200/60 max-w-[110px]"
                title="Select Delivery Location"
              >
                <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="truncate">{currentLocation.name.split(',')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* Mobile Location Selector Dropdown */}
              {isLocationOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Neighborhood</span>
                    <span className="text-[9px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded-full">Pune</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {PUNE_NEIGHBORHOODS.map((loc) => {
                      const isSelected = currentLocation.name === loc.name;
                      return (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            setLocation(loc);
                            setIsLocationOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 text-brand-600 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{loc.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-4 bg-slate-300 shrink-0" />

            {/* Mobile Search Input */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, cuisines..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none truncate"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
