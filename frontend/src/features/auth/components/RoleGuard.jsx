import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn, ChefHat } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function RoleGuard({ allowedRoles, children }) {
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const location = useLocation();

  // 1. If not authenticated at all, redirect to login with back redirect
  if (!isAuthenticated) {
    const isPartnerPath = location.pathname.startsWith('/partner');
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}${
          isPartnerPath ? '&role=partner' : ''
        }`}
        replace
      />
    );
  }

  // 2. If authenticated, check if role matches allowed roles
  const hasRequiredRole = !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(role);

  if (!hasRequiredRole) {
    const isTryingPartnerPortal = allowedRoles.includes('ROLE_RESTAURANT_OWNER');

    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-card text-center space-y-6 animate-scale-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            {isTryingPartnerPortal ? 'Partner Portal Restricted' : 'Access Restricted'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You are signed in as{' '}
            <span className="font-bold text-slate-800">
              {user?.name || user?.email || 'User'}
            </span>{' '}
            with role{' '}
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {role === 'ROLE_CUSTOMER' ? 'Customer' : role === 'ROLE_RESTAURANT_OWNER' ? 'Restaurant Partner' : role}
            </span>
            .
          </p>
          <p className="text-xs text-slate-500">
            {isTryingPartnerPortal
              ? 'This kitchen terminal is reserved strictly for verified Restaurant Partners and Kitchen Chefs.'
              : 'You do not have the required permissions to view this page.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </Link>

          {isTryingPartnerPortal && (
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = '/auth/login?role=partner';
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <ChefHat className="w-4 h-4" />
              <span>Switch to Partner Login</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}
