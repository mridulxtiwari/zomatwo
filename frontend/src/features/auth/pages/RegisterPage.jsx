import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, ChefHat } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { useAuthStore } from '../stores/useAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ROLE_CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
        role,
      });

      setAuth(response.data);

      if (role === 'ROLE_RESTAURANT_OWNER') {
        navigate('/partner/orders');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to register. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl shadow-card border border-slate-100">
      <div className="text-center space-y-2 mb-8">
        <span className="text-3xl font-extrabold text-brand-500 font-heading">
          zomatwo
        </span>
        <h2 className="text-2xl font-bold text-slate-900 font-heading">
          Create an account
        </h2>
        <p className="text-sm text-slate-500">
          Join Zomatwo to order food or manage your restaurant.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selector */}
      <div className="flex p-1 mb-6 rounded-2xl bg-slate-100">
        <button
          type="button"
          onClick={() => setRole('ROLE_CUSTOMER')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
            role === 'ROLE_CUSTOMER'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Customer</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('ROLE_RESTAURANT_OWNER')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
            role === 'ROLE_RESTAURANT_OWNER'
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Restaurant Partner</span>
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Creating account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold text-brand-500 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
