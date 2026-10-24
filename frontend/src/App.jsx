import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RoleGuard from './features/auth/components/RoleGuard';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import RestaurantDiscoveryPage from './features/catalog/pages/RestaurantDiscoveryPage';
import RestaurantMenuPage from './features/catalog/pages/RestaurantMenuPage';
import CheckoutPage from './features/checkout/pages/CheckoutPage';
import LiveOrderTrackingPage from './features/tracking/pages/LiveOrderTrackingPage';
import PartnerOrderDashboard from './features/partner/pages/PartnerOrderDashboard';
import CartDrawer from './features/cart/components/CartDrawer';
import ReplaceCartModal from './features/cart/components/ReplaceCartModal';

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar with Role-based access and location selector */}
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Routes>
          <Route path="/" element={<RestaurantDiscoveryPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/restaurant/:id" element={<RestaurantMenuPage />} />
          <Route
            path="/checkout"
            element={
              <RoleGuard allowedRoles={['ROLE_CUSTOMER', 'ROLE_ADMIN']}>
                <CheckoutPage />
              </RoleGuard>
            }
          />
          <Route
            path="/orders/:id/track"
            element={
              <RoleGuard allowedRoles={['ROLE_CUSTOMER', 'ROLE_ADMIN']}>
                <LiveOrderTrackingPage />
              </RoleGuard>
            }
          />
          <Route
            path="/partner/orders"
            element={
              <RoleGuard allowedRoles={['ROLE_RESTAURANT_OWNER', 'ROLE_ADMIN']}>
                <PartnerOrderDashboard />
              </RoleGuard>
            }
          />
        </Routes>
      </main>

      {/* Slide-over Cart Drawer & Overlays */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ReplaceCartModal />
    </div>
  );
}
