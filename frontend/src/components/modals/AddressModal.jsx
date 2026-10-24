import React, { useState } from 'react';
import { X, MapPin, Navigation, Home, Briefcase } from 'lucide-react';

export default function AddressModal({ isOpen, onClose, onSave }) {
  const [flatNo, setFlatNo] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('411014');
  const [addressType, setAddressType] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!streetAddress || !pincode) {
      alert('Please enter street address and pincode');
      return;
    }

    const newAddress = {
      id: Date.now(),
      flatNo,
      streetAddress,
      landmark,
      city,
      pincode,
      addressType,
      isDefault,
      latitude: 18.5514,
      longitude: 73.9352,
    };

    onSave(newAddress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 font-heading text-lg">
              Add Delivery Address
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Radar / Map Simulation Bar */}
        <div className="h-32 w-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center"
            style={{
              backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-500 ring-4 ring-brand-500/30 flex items-center justify-center animate-bounce">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
              <Navigation className="w-3 h-3 text-brand-400" />
              <span>Kharadi, Pune (GPS Pinned)</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Flat / House / Floor No.
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Tower B"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near EON IT Park"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Complete Street Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. World Trade Center, Kharadi Bypass Road"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pincode *
              </label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Address Tag Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tag This Location As
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Home', 'Work', 'Other'].map((type) => {
                const isSelected = addressType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {type === 'Home' && <Home className="w-3.5 h-3.5" />}
                    {type === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                    {type === 'Other' && <MapPin className="w-3.5 h-3.5" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Make Default Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-600 font-medium">
              Save as my default delivery address
            </span>
          </label>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
            >
              Save & Deliver Here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
