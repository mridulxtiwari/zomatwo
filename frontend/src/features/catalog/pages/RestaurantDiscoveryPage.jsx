import React, { useState, useMemo } from 'react';
import CuisineCarousel from '../components/CuisineCarousel/CuisineCarousel';
import OffersCarousel from '../components/Banners/OffersCarousel';
import FilterBar from '../components/FilterBar/FilterBar';
import RestaurantGrid from '../components/Views/RestaurantGrid';
import DiscoveryMapView from '../components/Views/DiscoveryMapView';
import { useRestaurants } from '../hooks/useRestaurants';
import { useLocationStore } from '../stores/useLocationStore';

// Fallback seed restaurants for Kharadi/Pune if catalog service is booting
const FALLBACK_RESTAURANTS = [
  {
    id: 1,
    name: 'Behrouz Biryani - The Royal Feast',
    cuisineTypes: 'Biryani, North Indian, Mughlai, Kebab',
    averageRating: 4.6,
    totalRatings: '3,800+',
    deliveryTimeMins: 22,
    distanceKm: 1.8,
    costForTwo: 650,
    isPureVeg: false,
    hasOffers: true,
    offerText: 'FLAT ₹125 OFF',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    latitude: 18.5524,
    longitude: 73.9365,
  },
  {
    id: 2,
    name: 'Toscano Artisanal Wood-Fired Pizza',
    cuisineTypes: 'Pizzas, Italian, Pasta, Desserts',
    averageRating: 4.8,
    totalRatings: '1,920+',
    deliveryTimeMins: 28,
    distanceKm: 2.4,
    costForTwo: 900,
    isPureVeg: false,
    hasOffers: true,
    offerText: '20% OFF UPTO ₹100',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    latitude: 18.5539,
    longitude: 73.9312,
  },
  {
    id: 3,
    name: 'Prasadam Pure Veg Thali & South Feast',
    cuisineTypes: 'South Indian, North Indian, Pure Veg',
    averageRating: 4.5,
    totalRatings: '4,100+',
    deliveryTimeMins: 18,
    distanceKm: 1.2,
    costForTwo: 350,
    isPureVeg: true,
    hasOffers: false,
    offerText: 'FREE DELIVERY',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
    latitude: 18.5492,
    longitude: 73.9341,
  },
  {
    id: 4,
    name: 'Burger & Co. Craft Smokehouse',
    cuisineTypes: 'Burgers, American, Wings, Shakes',
    averageRating: 4.4,
    totalRatings: '2,150+',
    deliveryTimeMins: 24,
    distanceKm: 2.9,
    costForTwo: 550,
    isPureVeg: false,
    hasOffers: true,
    offerText: 'BUY 1 GET 1 FREE',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    latitude: 18.5581,
    longitude: 73.9388,
  },
  {
    id: 5,
    name: 'Dragon Wok Asian Kitchen',
    cuisineTypes: 'Chinese, Asian, Dimsum, Thai',
    averageRating: 4.3,
    totalRatings: '1,420+',
    deliveryTimeMins: 32,
    distanceKm: 3.5,
    costForTwo: 600,
    isPureVeg: false,
    hasOffers: true,
    offerText: 'FLAT ₹80 OFF',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    latitude: 18.5465,
    longitude: 73.9287,
  },
  {
    id: 6,
    name: 'Cream & Fudge Gelato & Shakes',
    cuisineTypes: 'Desserts, Ice Cream, Waffles',
    averageRating: 4.7,
    totalRatings: '3,050+',
    deliveryTimeMins: 16,
    distanceKm: 1.5,
    costForTwo: 300,
    isPureVeg: true,
    hasOffers: false,
    offerText: 'SPECIAL COMBO',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    latitude: 18.5542,
    longitude: 73.9405,
  },
];

export default function RestaurantDiscoveryPage() {
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [pureVeg, setPureVeg] = useState(false);
  const [rating4Plus, setRating4Plus] = useState(false);
  const [fastDelivery, setFastDelivery] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  const { currentLocation, searchQuery } = useLocationStore();

  // Dynamic geospatial query based on selected neighborhood
  const { data, isLoading } = useRestaurants({
    lat: currentLocation.lat || 18.5514,
    lng: currentLocation.lng || 73.9352,
    radiusKm: 10,
    cuisine: selectedCuisine,
    minRating: rating4Plus ? 4.0 : null,
  });

  const rawRestaurants = data?.content && data.content.length > 0 ? data.content : FALLBACK_RESTAURANTS;

  // Filter application
  const filteredRestaurants = useMemo(() => {
    return rawRestaurants.filter((r) => {
      // Global search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesCuisine = r.cuisineTypes?.toLowerCase().includes(q);
        const matchesArea = r.addressLine?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q);
        if (!matchesName && !matchesCuisine && !matchesArea) {
          return false;
        }
      }

      if (selectedCuisine && !r.cuisineTypes?.toLowerCase().includes(selectedCuisine.toLowerCase())) {
        return false;
      }
      if (pureVeg && !(r.isPureVeg || r.cuisineTypes?.toLowerCase().includes('veg') || r.description?.toLowerCase().includes('veg'))) {
        return false;
      }
      if (rating4Plus && parseFloat(r.averageRating || 0) < 4.0) {
        return false;
      }
      const eta = r.distanceKm ? Math.max(15, Math.round(r.distanceKm * 8)) : (r.deliveryTimeMins || 25);
      if (fastDelivery && eta > 25) {
        return false;
      }
      if (offersOnly && r.hasOffers === false) {
        return false;
      }
      return true;
    });
  }, [rawRestaurants, searchQuery, selectedCuisine, pureVeg, rating4Plus, fastDelivery, offersOnly]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Offers & Deals Carousel (Directly below Navbar) */}
      <OffersCarousel
        onSelectOffer={(offer) => {
          if (offer.filterAction === 'Biryani') {
            setSelectedCuisine((prev) => (prev === 'Biryani' ? null : 'Biryani'));
          } else if (offer.filterAction === 'Desserts') {
            setSelectedCuisine((prev) => (prev === 'Desserts' ? null : 'Desserts'));
          } else if (offer.filterAction === 'FREE DELIVERY') {
            setFastDelivery(true);
          } else {
            setOffersOnly(true);
          }
        }}
      />

      {/* "What's on your mind?" Cuisine Carousel */}
      <CuisineCarousel
        selectedCuisine={selectedCuisine}
        onSelectCuisine={setSelectedCuisine}
      />

      {/* Sticky Filter Bar with Grid/Map Switcher */}
      <FilterBar
        pureVeg={pureVeg}
        onTogglePureVeg={() => setPureVeg((prev) => !prev)}
        rating4Plus={rating4Plus}
        onToggleRating4Plus={() => setRating4Plus((prev) => !prev)}
        fastDelivery={fastDelivery}
        onToggleFastDelivery={() => setFastDelivery((prev) => !prev)}
        offersOnly={offersOnly}
        onToggleOffersOnly={() => setOffersOnly((prev) => !prev)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        totalResults={filteredRestaurants.length}
      />

      {/* Main View: Grid vs Interactive Map */}
      <div className="pt-2">
        {viewMode === 'grid' ? (
          <RestaurantGrid restaurants={filteredRestaurants} loading={isLoading} />
        ) : (
          <DiscoveryMapView restaurants={filteredRestaurants} />
        )}
      </div>
    </div>
  );
}
