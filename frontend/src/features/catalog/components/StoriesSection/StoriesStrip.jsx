import React from 'react';
import { Zap, Sparkles, Flame, Wine, Leaf } from 'lucide-react';

const STORIES = [
  { id: 1, title: 'Flash Deals', icon: Zap, ringColor: 'from-purple-500 to-indigo-600', badge: '50% OFF' },
  { id: 2, title: 'Biryani Fest', icon: Flame, ringColor: 'from-amber-500 to-red-500', badge: 'Trending' },
  { id: 3, title: 'Gourmet', icon: Wine, ringColor: 'from-rose-500 to-pink-600', badge: 'Top Rated' },
  { id: 4, title: 'New In Town', icon: Sparkles, ringColor: 'from-yellow-400 to-amber-500', badge: 'Hot' },
  { id: 5, title: 'Pure Veg', icon: Leaf, ringColor: 'from-emerald-400 to-green-600', badge: 'Pure' },
];

export default function StoriesStrip({ onSelectStory }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight font-heading">
          Stories & Highlights
        </h3>
      </div>
      <div className="flex items-center gap-4 overflow-x-auto pt-2 pb-2 px-1 -mx-1 scrollbar-none">
        {STORIES.map((story) => {
          const Icon = story.icon;
          return (
            <button
              key={story.id}
              onClick={() => onSelectStory?.(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className={`p-0.5 rounded-full bg-gradient-to-tr ${story.ringColor} shadow-sm group-hover:scale-105 transition-transform`}>
                <div className="p-3 rounded-full bg-white text-slate-800">
                  <Icon className="w-5 h-5 text-slate-800" />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-500 transition-colors">
                {story.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
