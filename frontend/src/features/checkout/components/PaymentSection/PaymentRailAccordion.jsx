import React, { useState } from 'react';
import { Smartphone, CreditCard, Building2, Banknote, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

export default function PaymentRailAccordion({
  selectedMethod,
  onSelectMethod,
}) {
  const [upiId, setUpiId] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 font-heading">
          Select Payment Method
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% RBI Compliant & Encrypted</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. UPI Payment Rail */}
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden ${
            selectedMethod === 'upi'
              ? 'border-brand-500 bg-red-50/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            onClick={() => onSelectMethod('upi')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                    UPI (Google Pay, PhonePe, Paytm, QR)
                  </h4>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    FASTEST
                  </span>
                </div>
                <p className="text-xs text-slate-500">Pay directly via any UPI app or scan dynamic QR</p>
              </div>
            </div>
            {selectedMethod === 'upi' && (
              <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500 text-white" />
            )}
          </div>

          {selectedMethod === 'upi' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 animate-fade-in">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    !showQr
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Enter UPI ID / VPA
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    showQr
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {!showQr ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => alert(`UPI ID ${upiId || 'test@upi'} verified!`)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Verify
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=zomatwo@icici&pn=ZomatwoFood&am=648"
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    Scan with any UPI app to pay instantly
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Credit & Debit Cards Rail */}
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden ${
            selectedMethod === 'card'
              ? 'border-brand-500 bg-red-50/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            onClick={() => onSelectMethod('card')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                  Credit & Debit Cards
                </h4>
                <p className="text-xs text-slate-500">Visa, Mastercard, RuPay, Diners, American Express</p>
              </div>
            </div>
            {selectedMethod === 'card' && (
              <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500 text-white" />
            )}
          </div>

          {selectedMethod === 'card' && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8821"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    type="text"
                    placeholder="10/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Netbanking Rail */}
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden ${
            selectedMethod === 'netbanking'
              ? 'border-brand-500 bg-red-50/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            onClick={() => onSelectMethod('netbanking')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                  Netbanking
                </h4>
                <p className="text-xs text-slate-500">All major Indian banks supported</p>
              </div>
            </div>
            {selectedMethod === 'netbanking' && (
              <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500 text-white" />
            )}
          </div>
        </div>

        {/* 4. Cash On Delivery Rail */}
        <div
          className={`rounded-2xl border-2 transition-all overflow-hidden ${
            selectedMethod === 'cod'
              ? 'border-brand-500 bg-red-50/10'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            onClick={() => onSelectMethod('cod')}
            className="p-4 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                  Cash on Delivery (COD)
                </h4>
                <p className="text-xs text-slate-500">Pay cash or UPI at your doorstep upon delivery</p>
              </div>
            </div>
            {selectedMethod === 'cod' && (
              <CheckCircle2 className="w-5 h-5 text-brand-500 fill-brand-500 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
