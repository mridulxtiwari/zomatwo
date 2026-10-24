import React from 'react';
import { Home, Briefcase, MapPin, CheckCircle2 } from 'lucide-react';

export default function AddressCard({ address, isSelected, onSelect }) {
  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'home':
        return <Home className="w-4 h-4 text-brand-500" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(address)}
      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
        isSelected
          ? 'border-brand-500 bg-red-50/20 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="space-y-2">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100">{getIcon(address.addressType)}</div>
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              {address.addressType || 'Home'}
            </span>
            {address.isDefault && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                Default
              </span>
            )}
          </div>
          {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500 text-white" />}
        </div>

        {/* Address Lines */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {address.flatNo ? `${address.flatNo}, ` : ''}
          {address.streetAddress}, {address.landmark ? `Near ${address.landmark}, ` : ''}
          {address.city} - {address.pincode}
        </p>
      </div>

      <div className="pt-3 text-[11px] text-slate-500 font-medium">
        Delivers in <strong className="text-slate-800">20-25 mins</strong>
      </div>
    </div>
  );
}
