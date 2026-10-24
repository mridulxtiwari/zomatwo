import React from 'react';
import { DoorClosed, BellOff, ShieldAlert, PhoneOff } from 'lucide-react';

const PREFERENCES = [
  { id: 'leave_at_door', label: 'Leave at door', icon: DoorClosed },
  { id: 'dont_ring_bell', label: "Don't ring bell", icon: BellOff },
  { id: 'leave_with_guard', label: 'Leave with guard', icon: ShieldAlert },
  { id: 'avoid_calling', label: 'Avoid calling', icon: PhoneOff },
];

export default function DeliveryPreferenceChips({
  selectedPreferences = [],
  onTogglePreference,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
        Delivery Instructions
      </label>
      <div className="flex flex-wrap gap-2">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const isSelected = selectedPreferences.includes(pref.id);
          return (
            <button
              key={pref.id}
              type="button"
              onClick={() => onTogglePreference(pref.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{pref.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
