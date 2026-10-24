import React from 'react';

const CUISINES = [
  { id: 'all', name: 'All Cuisines', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80' },
  { id: 'Biryani', name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
  { id: 'Pizza', name: 'Pizzas', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
  { id: 'Burgers', name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
  { id: 'Rolls', name: 'Shawarma & Rolls', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&q=80' },
  { id: 'North Indian', name: 'Thali & Curry', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80' },
  { id: 'Chinese', name: 'Noodles & Dimsum', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80' },
  { id: 'Desserts', name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' },
];

export default function CuisineCarousel({ selectedCuisine, onSelectCuisine }) {
  return (
    <div className="space-y-4 text-left md:text-center">
      <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
        What's on your mind?
      </h3>
      <div className="flex items-center justify-start md:justify-center gap-5 md:gap-7 overflow-x-auto pt-3 pb-4 px-2 -mx-2 scrollbar-none">
        {CUISINES.map((item) => {
          const isSelected = (selectedCuisine === null && item.id === 'all') || selectedCuisine === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectCuisine(item.id === 'all' ? null : item.id)}
              className="flex flex-col items-center gap-2.5 shrink-0 group focus:outline-none p-1"
            >
              <div
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full p-0.5 transition-all duration-200 ${
                  isSelected
                    ? 'ring-4 ring-brand-500 shadow-glow-red scale-105'
                    : 'group-hover:scale-105 group-hover:shadow-md'
                }`}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <span
                className={`text-xs md:text-sm font-semibold transition-colors ${
                  isSelected ? 'text-brand-500' : 'text-slate-700 group-hover:text-slate-900'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
