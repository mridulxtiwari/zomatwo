import React from 'react';
import { Phone, CheckCircle } from 'lucide-react';

export default function PhoneConfirmation({ phone = '+91 98234 56789' }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-500 font-medium block text-[11px]">Contact for Delivery Updates</span>
          <span className="font-extrabold text-slate-800 text-sm tracking-wide">{phone}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Verified</span>
      </div>
    </div>
  );
}
