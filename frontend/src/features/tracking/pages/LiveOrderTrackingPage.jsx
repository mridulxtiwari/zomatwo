import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Bike,
  Utensils,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

const STAGES = [
  { key: 'CONFIRMED', label: 'Order Confirmed', time: 'Just now', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Kitchen Preparing', time: '10-15 mins', icon: Utensils },
  { key: 'READY_FOR_PICKUP', label: 'Food Ready', time: '5 mins', icon: Sparkles },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', time: '10 mins', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', time: 'Enjoy your meal!', icon: MapPin },
];

export default function LiveOrderTrackingPage() {
  const { id } = useParams();
  const [currentStageIndex, setCurrentStageIndex] = useState(1); // Default PREPARING for exciting demo
  const [etaMins, setEtaMins] = useState(22);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [order, setOrder] = useState(() => {
    try {
      const stored = localStorage.getItem('zomatwo-current-order');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // SSE EventSource Connection to :8080/api/v1/stream/orders/:id
  useEffect(() => {
    let eventSource;
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
      eventSource = new EventSource(`${apiBase}/stream/orders/${id}`);

      eventSource.addEventListener('INIT', (e) => {
        setIsLiveConnected(true);
        console.log('SSE Stream Connected:', e.data);
      });

      eventSource.addEventListener('ORDER_STATUS', (e) => {
        try {
          const data = JSON.parse(e.data);
          const status = data.currentStatus || data.status;
          const stageIdx = STAGES.findIndex((s) => s.key === status);
          if (stageIdx > -1) {
            setCurrentStageIndex(stageIdx);
          }
        } catch (err) {
          console.error('SSE JSON parse error', err);
        }
      });

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.warn('SSE EventSource not supported or backend offline. Simulation active.');
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [id]);

  // Demo advance simulator
  const advanceToStage = async (index) => {
    setCurrentStageIndex(index);
    if (index === 2) setEtaMins(15);
    if (index === 3) setEtaMins(8);
    if (index === 4) setEtaMins(0);

    const targetStatus = STAGES[index].key;
    try {
      await axiosClient.put(ENDPOINTS.ORDERS.PARTNER_ORDER_STATUS(id), {
        status: targetStatus,
      });
    } catch (e) {
      console.debug('Backend stage sync skipped:', e);
    }
  };

  const currentStage = STAGES[currentStageIndex];
  const restaurantName = order?.restaurantName || 'The Biryani Project';

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-fade-in space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to restaurants</span>
        </Link>

        {/* Live SSE Pulse Badge */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLiveConnected ? 'bg-emerald-400' : 'bg-brand-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLiveConnected ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-slate-700">
            {isLiveConnected ? 'Live SSE Stream Connected' : 'Live Tracking Simulation'}
          </span>
        </div>
      </div>

      {/* Main ETA Hero Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-red-600 via-brand-500 to-orange-500 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated Delivery</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight">
            {currentStageIndex === 4 ? 'Order Delivered!' : `Arriving in ${etaMins} mins`}
          </h1>
          <p className="text-white/90 text-sm">
            {currentStageIndex === 4
              ? 'Hope you loved your feast! Rate your meal below.'
              : `${currentStage.label} • ${restaurantName}`}
          </p>
        </div>

        {/* Delivery OTP Badge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center self-start md:self-auto min-w-[140px]">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-white/80 block">
            Delivery OTP
          </span>
          <span className="text-2xl font-black tracking-widest text-white mt-0.5 block">
            4892
          </span>
          <span className="text-[10px] text-white/70 block mt-0.5">Share with rider only</span>
        </div>
      </div>

      {/* 5-Stage Stepper Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 font-heading">
          Order Progress
        </h3>

        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-0 hidden sm:block" />
          <div
            className="absolute top-5 left-6 h-1 bg-brand-500 transition-all duration-700 -z-0 hidden sm:block"
            style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 92}%` }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex flex-col sm:items-center sm:text-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/25 shadow-lg scale-110'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-brand-500' : isPast ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <span className="text-[10px] text-slate-500 block">{stage.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demo Stage Advance Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            ⚡ Demo Stage Controls:
          </span>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                onClick={() => advanceToStage(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  currentStageIndex === idx
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {idx + 1}. {s.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Rider Info + Live Radar Map */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Delivery Partner Card */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider font-heading">
            Delivery Partner
          </h3>

          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
              alt="Rider"
              className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-emerald-500/30"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-slate-900 text-sm">Ramesh Pawar</h4>
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  4.9 ★
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">TVS Jupiter • MH 12 AB 4592</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vaccinated & Temperature Checked</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => alert('Calling delivery partner Ramesh Pawar: +91 98901 23456')}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Opening chat with delivery partner')}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Live Simulated GPS Radar Map */}
        <div className="md:col-span-7 h-72 rounded-3xl bg-slate-950 relative overflow-hidden border border-slate-800 shadow-md flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-40 bg-cover bg-center"
            style={{
              backgroundImage: `radial-gradient(#334155 1.5px, transparent 1.5px), radial-gradient(#1e293b 1.5px, #020617 1.5px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Restaurant Pin */}
          <div className="absolute left-[20%] top-[45%] flex flex-col items-center z-10">
            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-brand-500 flex items-center justify-center shadow-lg">
              <Utensils className="w-4 h-4 text-brand-500" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-bold text-white border border-slate-700">
              Kitchen
            </span>
          </div>

          {/* Dotted Delivery Route Path */}
          <div className="absolute left-[24%] right-[24%] top-[50%] h-0.5 border-t-2 border-dashed border-brand-500/60" />

          {/* Moving Animated Scooter Pin */}
          <div
            className="absolute top-[38%] -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-1000"
            style={{
              left: `${25 + currentStageIndex * 15}%`,
            }}
          >
            <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xl ring-4 ring-brand-500/30 animate-pulse">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-brand-500 text-[10px] font-extrabold text-white shadow-md">
              Ramesh • {etaMins}m
            </span>
          </div>

          {/* Customer Delivery Pin */}
          <div className="absolute right-[18%] top-[45%] flex flex-col items-center z-10">
            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center shadow-lg">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-bold text-blue-300 border border-slate-700">
              You (Kharadi)
            </span>
          </div>
        </div>
      </div>

      {/* Order Summary & Dishes Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider font-heading">
                Items in this Order ({order.items?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.restaurantName} • {order.orderNumber}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Paid • ₹{order.grandTotal}
            </span>
          </div>

          <div className="space-y-2 divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                    {item.quantity}x
                  </span>
                  <span className="font-semibold text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {order.address && (
            <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Delivering to: </span>
                <span>
                  {order.address.flatNo ? `${order.address.flatNo}, ` : ''}
                  {order.address.streetAddress || order.address.fullAddress}, {order.address.city || 'Pune'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
