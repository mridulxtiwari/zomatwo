import React from 'react';
import { Plus } from 'lucide-react';
import AddressCard from './AddressCard';

export default function AddressCardGrid({
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onAddNew,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 font-heading">
          Select Delivery Address
        </h3>
        <span className="text-xs text-slate-500">
          {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {addresses.map((addr) => (
          <AddressCard
            key={addr.id}
            address={addr}
            isSelected={selectedAddressId === addr.id}
            onSelect={onSelectAddress}
          />
        ))}

        {/* Add New Address Card Button */}
        <button
          type="button"
          onClick={onAddNew}
          className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/50 hover:bg-brand-50/20 text-slate-600 hover:text-brand-500 transition-all flex flex-col items-center justify-center gap-2 group min-h-[110px]"
        >
          <div className="w-8 h-8 rounded-full bg-white group-hover:bg-brand-500 group-hover:text-white border border-slate-200 group-hover:border-transparent flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 text-slate-600 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold font-heading">
            Add New Address
          </span>
        </button>
      </div>
    </div>
  );
}
