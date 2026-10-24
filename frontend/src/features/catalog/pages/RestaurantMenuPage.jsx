import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import RestaurantHeroHeader from '../components/MenuComponents/RestaurantHeroHeader';
import StickyCategoryTabs from '../components/MenuComponents/StickyCategoryTabs';
import MenuItemCard from '../components/MenuComponents/MenuItemCard';
import ReplaceCartModal from '../../cart/components/ReplaceCartModal';
import CartDrawer from '../../cart/components/CartDrawer';
import { useCartStore } from '../../cart/stores/useCartStore';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';

// Fallback rich menu for demo preview
const FALLBACK_MENU = {
  id: 1,
  name: 'Behrouz Biryani - The Royal Feast',
  cuisineTypes: 'Biryani, North Indian, Mughlai, Kebab',
  averageRating: 4.6,
  totalRatings: '3,800+',
  deliveryTimeMins: 22,
  costForTwo: 650,
  isGold: true,
  address: 'Shop 14, World Trade Center, Kharadi, Pune',
  area: 'Kharadi',
  imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
  items: [
    {
      id: 101,
      name: 'Dum Gosht Biryani (Boneless)',
      category: 'Biryani',
      price: 449,
      isVeg: false,
      isBestseller: true,
      rating: 4.8,
      reviewCount: 312,
      description: 'Slow-cooked succulent mutton layered with aromatic basmati rice, saffron, and royal spices. Served with gulab jamun and mirchi ka salan.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    },
    {
      id: 102,
      name: 'Subz-e-Biryani (Royal Veg)',
      category: 'Biryani',
      price: 329,
      isVeg: true,
      isBestseller: true,
      rating: 4.6,
      reviewCount: 220,
      description: 'Garden fresh vegetables and paneer simmered in aromatic gravy and layered with long-grain saffron rice.',
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80',
    },
    {
      id: 103,
      name: 'Murgh Tikka Kebab (6 Pcs)',
      category: 'Starters',
      price: 369,
      isVeg: false,
      isBestseller: true,
      rating: 4.7,
      reviewCount: 180,
      description: 'Tender chicken cubes marinated in tandoori spices and char-grilled in a clay oven with mint chutney.',
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&q=80',
    },
    {
      id: 104,
      name: 'Paneer Lababdar',
      category: 'Main Course',
      price: 349,
      isVeg: true,
      isBestseller: false,
      rating: 4.5,
      reviewCount: 95,
      description: 'Soft cottage cheese simmered in a luscious tomato, cashew, and onion gravy flavored with kasoori methi.',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
    },
    {
      id: 105,
      name: 'Butter Garlic Naan',
      category: 'Breads',
      price: 69,
      isVeg: true,
      isBestseller: false,
      rating: 4.7,
      reviewCount: 420,
      description: 'Refined flour flatbread brushed with fresh minced garlic and creamy country butter.',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    },
    {
      id: 106,
      name: 'Angoori Gulab Jamun (4 Pcs)',
      category: 'Desserts',
      price: 129,
      isVeg: true,
      isBestseller: false,
      rating: 4.9,
      reviewCount: 290,
      description: 'Delicate reduced-milk spheres soaked in warm cardamom and rose-scented syrup.',
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&q=80',
    },
  ],
};

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const { items, getTotalItemsCount, getSubtotal } = useCartStore();
  const { data: remoteData, isLoading } = useRestaurantMenu(id);

  const restaurant = useMemo(() => {
    if (remoteData?.restaurant) {
      const r = remoteData.restaurant;
      return {
        id: r.id,
        name: r.name,
        cuisineTypes: r.cuisineTypes,
        averageRating: r.averageRating,
        totalRatings: r.totalRatingsCount ? `${(r.totalRatingsCount / 1000).toFixed(1)}k+` : '1.8k+',
        deliveryTimeMins: r.distanceKm ? Math.max(15, Math.round(r.distanceKm * 8)) : 22,
        costForTwo: r.costForTwo,
        isGold: true,
        address: r.addressLine || `${r.city || 'Kharadi, Pune'}`,
        area: r.addressLine?.split(',')?.pop()?.trim() || r.city || 'Kharadi',
        imageUrl: r.imageUrl,
        deliveryFee: 35,
      };
    }
    return FALLBACK_MENU;
  }, [remoteData]);

  const menuItems = useMemo(() => {
    if (remoteData?.categories && remoteData.categories.length > 0) {
      return remoteData.categories.flatMap((catGroup) =>
        catGroup.items.map((item) => ({
          ...item,
          category: catGroup.category || 'Specialties',
          isBestseller: item.price > 250,
          rating: 4.7,
          reviewCount: 140,
        }))
      );
    }
    return FALLBACK_MENU.items;
  }, [remoteData]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(menuItems.map((item) => item.category || 'General'))];
    return cats;
  }, [menuItems]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      if (activeCategory !== 'All' && dish.category !== activeCategory) {
        return false;
      }
      if (vegOnly && !dish.isVeg) {
        return false;
      }
      if (searchQuery && !dish.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, vegOnly, searchQuery]);

  // Group dishes by category if 'All' is selected
  const groupedCategories = useMemo(() => {
    if (activeCategory !== 'All') {
      return { [activeCategory]: filteredDishes };
    }
    return filteredDishes.reduce((acc, dish) => {
      const cat = dish.category || 'Dishes';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(dish);
      return acc;
    }, {});
  }, [filteredDishes, activeCategory]);

  const totalItemsCount = getTotalItemsCount();
  const subtotal = getSubtotal();

  return (
    <div className="pb-24 animate-fade-in max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to restaurants</span>
        </Link>
      </div>

      {/* Restaurant Hero Card */}
      <RestaurantHeroHeader restaurant={restaurant} />

      {/* Sticky Category Tabs & Filters */}
      <StickyCategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        vegOnly={vegOnly}
        onToggleVegOnly={() => setVegOnly((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Dishes List */}
      <div className="space-y-8">
        {Object.entries(groupedCategories).map(([categoryName, dishes]) => (
          <div key={categoryName} className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 font-heading border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{categoryName}</span>
              <span className="text-xs text-slate-400 font-normal">
                {dishes.length} {dishes.length === 1 ? 'item' : 'items'}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dishes.map((dish) => (
                <MenuItemCard
                  key={dish.id}
                  item={dish}
                  restaurant={restaurant}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredDishes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700">No dishes match your filter</h4>
            <p className="text-xs text-slate-400 mt-1">Try turning off Veg Only or clearing your search.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Pill when Cart is not empty */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 animate-slide-up">
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-xl shadow-brand-500/30 flex items-center justify-between transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold text-white/80 uppercase">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </div>
                <div className="text-sm font-extrabold">₹{subtotal} plus taxes</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-xl">
              <span>View Cart</span>
              <span>➔</span>
            </div>
          </button>
        </div>
      )}

      {/* Modals & Overlays */}
      <ReplaceCartModal />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  );
}
