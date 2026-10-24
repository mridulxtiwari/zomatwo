import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Navigation, ZoomIn, ZoomOut, ArrowRight, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DiscoveryMapView({ restaurants = [] }) {
  const navigate = useNavigate();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const activeRestaurant = selectedRestaurant || restaurants[0] || null;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = activeRestaurant?.latitude || 18.5514;
    const initialLng = activeRestaurant?.longitude || 73.9352;

    // Clean up if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    // Crisp OpenStreetMap Tiles (100% free, zero watermark)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when restaurants or activeRestaurant changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    restaurants.forEach((r) => {
      const lat = r.latitude || 18.5514;
      const lng = r.longitude || 73.9352;
      const isSelected = activeRestaurant?.id === r.id;
      const rating = r.averageRating ? parseFloat(r.averageRating).toFixed(1) : '4.5';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background: ${isSelected ? '#E23744' : '#0F172A'};
            color: white;
            padding: 5px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.35);
            border: 2px solid white;
            cursor: pointer;
            white-space: nowrap;
            transform: scale(${isSelected ? 1.15 : 1});
            transition: transform 0.2s ease;
          ">
            <span>${r.name.length > 14 ? r.name.substring(0, 12) + '..' : r.name}</span>
            <span style="
              background: #16A34A;
              padding: 1px 5px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 900;
            ">${rating}★</span>
          </div>
        `,
        iconSize: [110, 32],
        iconAnchor: [55, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedRestaurant(r);
        map.flyTo([lat, lng], 15, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });
  }, [restaurants, activeRestaurant]);

  const handleSelectRestaurant = (r) => {
    setSelectedRestaurant(r);
    if (mapInstanceRef.current && r.latitude && r.longitude) {
      mapInstanceRef.current.flyTo([r.latitude, r.longitude], 15, { duration: 0.8 });
    }
  };

  const handleZoom = (delta) => {
    if (mapInstanceRef.current) {
      const current = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(current + delta);
    }
  };

  return (
    <div className="h-[620px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col md:flex-row bg-slate-900 text-white">
      {/* Left Column (40%): Scrollable Compact Cards */}
      <div className="w-full md:w-[38%] h-64 md:h-full overflow-y-auto p-4 space-y-3 bg-slate-900 border-r border-slate-800 scrollbar-thin">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Nearby Places ({restaurants.length})
          </span>
          <span className="text-xs text-brand-500 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Interactive Map</span>
          </span>
        </div>

        {restaurants.map((r) => {
          const isSelected = activeRestaurant?.id === r.id;
          const rating = r.averageRating ? parseFloat(r.averageRating).toFixed(1) : '4.5';
          const distance = r.distanceKm ? `${r.distanceKm} km` : '1.8 km';
          const eta = r.distanceKm ? Math.max(15, Math.round(r.distanceKm * 8)) : 22;

          return (
            <div
              key={r.id}
              onClick={() => handleSelectRestaurant(r)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                isSelected
                  ? 'bg-slate-800 border-brand-500 ring-2 ring-brand-500/30 shadow-lg'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <img
                src={r.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80'}
                alt={r.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="font-extrabold text-sm text-white truncate font-heading">
                      {r.name}
                    </h5>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shrink-0">
                      <span>{rating}</span>
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {r.cuisineTypes}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                  <span className="font-medium text-slate-400">{eta} mins • {distance}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/restaurant/${r.id}`);
                    }}
                    className="px-3 py-1 rounded-lg bg-brand-500 text-white font-extrabold text-[10px] hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Column (62%): Live Interactive Leaflet Map */}
      <div className="w-full md:w-[62%] h-full relative bg-slate-100 overflow-hidden">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Header Pill */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <Navigation className="w-3.5 h-3.5 text-brand-500" />
            <span>Kharadi, Pune • Interactive Street Map</span>
          </div>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-8 h-8 rounded-xl bg-white/95 text-slate-800 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-8 h-8 rounded-xl bg-white/95 text-slate-800 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Selected Restaurant Card Preview */}
        {activeRestaurant && (
          <div className="absolute bottom-5 left-5 right-5 z-10 max-w-sm mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-200 text-slate-900 flex items-center justify-between gap-3 animate-slide-up">
            <img
              src={activeRestaurant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&q=80'}
              alt={activeRestaurant.name}
              className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h5 className="font-extrabold text-xs text-slate-900 truncate font-heading">
                {activeRestaurant.name}
              </h5>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {activeRestaurant.cuisineTypes}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-600">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-black">
                  {parseFloat(activeRestaurant.averageRating || 4.5).toFixed(1)} ★
                </span>
                <span>• ₹{activeRestaurant.costForTwo || 600} for two</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/restaurant/${activeRestaurant.id}`)}
              className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1 shrink-0"
            >
              <span>Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
