import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  Volume2,
  VolumeX,
  Search,
  AlertTriangle,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

const INITIAL_ORDERS = [
  {
    id: 101,
    orderNumber: 'ORD-78921-KH',
    customerName: 'Aarav Sharma',
    phone: '+91 98234 56789',
    items: [
      { name: 'Dum Gosht Biryani (Boneless)', quantity: 2, price: 449 },
      { name: 'Butter Garlic Naan', quantity: 3, price: 69 },
    ],
    grandTotal: 1105,
    status: 'CONFIRMED', // Incoming
    timeAgo: '2 mins ago',
    instructions: 'Extra spicy, leave at door',
  },
  {
    id: 102,
    orderNumber: 'ORD-78922-VN',
    customerName: 'Priya Iyer',
    phone: '+91 98451 12340',
    items: [
      { name: 'Subz-e-Biryani (Royal Veg)', quantity: 1, price: 329 },
      { name: 'Angoori Gulab Jamun (4 Pcs)', quantity: 2, price: 129 },
    ],
    grandTotal: 587,
    status: 'PREPARING', // In kitchen
    timeAgo: '12 mins ago',
    instructions: 'Less oil please',
  },
  {
    id: 103,
    orderNumber: 'ORD-78923-KP',
    customerName: 'Rohan Mehra',
    phone: '+91 98765 88990',
    items: [
      { name: 'Murgh Tikka Kebab (6 Pcs)', quantity: 2, price: 369 },
      { name: 'Paneer Lababdar', quantity: 1, price: 349 },
    ],
    grandTotal: 1087,
    status: 'READY_FOR_PICKUP', // Ready
    timeAgo: '18 mins ago',
    instructions: 'Rider arriving in 3 mins',
  },
];

export default function PartnerOrderDashboard() {
  const [orders, setOrders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('zomatwo-partner-orders') || '[]');
      if (stored && stored.length > 0) {
        const existingIds = new Set(stored.map((o) => o.id));
        return [...stored, ...INITIAL_ORDERS.filter((o) => !existingIds.has(o.id))];
      }
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Kitchen Overloaded');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real-time active orders from backend for restaurant 101
  const fetchActiveOrders = async () => {
    try {
      setIsRefreshing(true);
      const authStorage = localStorage.getItem('zomatwo-auth-storage');
      const token = authStorage ? JSON.parse(authStorage)?.state?.accessToken : null;
      if (!token || token.startsWith('demo_')) {
        // Unauthenticated or local demo preview - continue with local state
        return;
      }

      const res = await axiosClient.get('/partner/restaurants/101/orders');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const apiOrders = res.data.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber ? `ORD-${o.orderNumber.slice(0, 5)}` : `ORD-${o.id}`,
          customerName: `Customer #${o.customerId}`,
          phone: '+91 98234 56789',
          items: (o.items || []).map((i) => ({
            name: i.itemName,
            quantity: i.quantity,
            price: i.price,
          })),
          grandTotal: o.grandTotal,
          status: o.status,
          timeAgo: 'Just now',
          instructions: o.deliveryInstructions || 'Leave at door',
        }));

        setOrders((prev) => {
          const apiIds = new Set(apiOrders.map((a) => a.id));
          const remainingLocal = prev.filter((p) => !apiIds.has(p.id));
          return [...apiOrders, ...remainingLocal];
        });
      }
    } catch (err) {
      console.debug('Active orders backend sync skipped, continuing with local state');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 30000); // Relaxed to 30s for performance
    return () => clearInterval(interval);
  }, []);

  const incomingOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const kitchenOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');

  const handleUpdateStatus = async (orderId, targetStatus) => {
    try {
      const authStorage = localStorage.getItem('zomatwo-auth-storage');
      const token = authStorage ? JSON.parse(authStorage)?.state?.accessToken : null;
      if (token && !token.startsWith('demo_')) {
        await axiosClient.put(ENDPOINTS.ORDERS.PARTNER_ORDER_STATUS(orderId), {
          status: targetStatus,
        });
      }
    } catch (e) {
      console.warn('Backend status update call fallback; applying optimistic local state:', e);
    }

    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o));
      try {
        localStorage.setItem('zomatwo-partner-orders', JSON.stringify(updated.slice(0, 15)));
      } catch {}
      return updated;
    });
  };

  const handleReject = async () => {
    if (!rejectingOrder) return;
    try {
      await axiosClient.put(ENDPOINTS.ORDERS.PARTNER_ORDER_STATUS(rejectingOrder.id), {
        status: 'CANCELLED',
      });
    } catch (e) {
      console.debug('Backend reject fallback');
    }
    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== rejectingOrder.id);
      try {
        localStorage.setItem('zomatwo-partner-orders', JSON.stringify(filtered.slice(0, 15)));
      } catch {}
      return filtered;
    });
    setRejectingOrder(null);
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Partner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Live Kitchen Terminal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading mt-1">
            The Biryani Project • Partner Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Outlet #4, Ground Floor, World Trade Center, Kharadi, Pune
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Order Chime ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={fetchActiveOrders}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors border border-slate-700 disabled:opacity-50 flex items-center justify-center"
            title="Refresh orders now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Incoming Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="font-extrabold text-sm text-amber-900 font-heading">
                Incoming Orders
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
              {incomingOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {incomingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-md space-y-4 animate-scale-up"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {order.orderNumber}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {order.customerName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-brand-500 block">
                      ₹{order.grandTotal}
                    </span>
                    <span className="text-[10px] text-slate-400">{order.timeAgo}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5 text-xs">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        <strong className="text-slate-900">{i.quantity}x</strong> {i.name}
                      </span>
                      <span className="font-medium text-slate-500">₹{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.instructions && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg italic">
                    Note: {order.instructions}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingOrder(order)}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    className="py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Accept Order</span>
                  </button>
                </div>
              </div>
            ))}

            {incomingOrders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No new incoming orders right now
              </div>
            )}
          </div>
        </div>

        {/* Column 2: In Kitchen (Cooking) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-extrabold text-sm text-blue-900 font-heading">
                In Kitchen (Preparing)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 text-xs font-black">
              {kitchenOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {kitchenOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {order.orderNumber}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {order.customerName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      ₹{order.grandTotal}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">Cooking...</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        <strong className="text-slate-900">{i.quantity}x</strong> {i.name}
                      </span>
                      <span className="font-medium text-slate-500">₹{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Food Ready</span>
                </button>
              </div>
            ))}

            {kitchenOrders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No orders currently in preparation
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready for Handover */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-extrabold text-sm text-emerald-900 font-heading">
                Ready for Handover
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-black">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-emerald-300 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">
                      {order.orderNumber}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {order.customerName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-700 block">
                      ₹{order.grandTotal}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">Packed & Hot</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        <strong className="text-slate-900">{i.quantity}x</strong> {i.name}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Bike className="w-4 h-4 text-brand-400" />
                  <span>Handover to Rider</span>
                </button>
              </div>
            ))}

            {readyOrders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No orders waiting for pickup
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                Reject Order #{rejectingOrder.orderNumber}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Rejecting an order triggers an automatic refund compensation to the customer.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Reason
              </label>
              {['Kitchen Overloaded', 'Item Out of Stock', 'Outlet Closing Early', 'Other'].map(
                (reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="rejection_reason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-xs font-medium text-slate-800">{reason}</span>
                  </label>
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
