'use client';

import { useState } from 'react';
import { Mail, Lock, Building2, Phone, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Supabase dynamic client imports
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Mock Auth Mode if Supabase settings are missing
        console.log("Supabase credentials missing, entering sandbox preview mode.");
        setTimeout(() => {
          onLoginSuccess({
            id: 'mock-user-123',
            email: email || 'supervisor@yashmarble.com',
            user_metadata: {
              business_name: businessName || 'Yash Marble & Tiles',
              phone_number: phoneNumber || '+91 9876543210'
            }
          });
          setLoading(false);
        }, 850);
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;
        onLoginSuccess(data.user);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              phone_number: phoneNumber
            }
          }
        });
        if (authError) throw authError;
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    onLoginSuccess({
      id: 'sandbox-preview',
      email: 'sandbox@yashmarble.com',
      user_metadata: {
        business_name: 'Yash Marble & Tiles',
        phone_number: '+91 9998887776'
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-red-500/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-slate-500/5 blur-[100px]" />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary text-white font-bold text-3xl shadow-lg shadow-primary/20">
            Y
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Yash <span className="text-primary">Marble</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Tiles Calculator & Quotation Suite
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-xl space-y-6">
          {/* Tabs */}
          <div className="flex rounded-sm bg-slate-50 p-1 border border-slate-200">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`w-1/2 py-2 text-sm font-medium rounded-sm transition-all ${
                isLogin ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`w-1/2 py-2 text-sm font-medium rounded-sm transition-all ${
                !isLogin ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-250 rounded-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Business Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Building2 size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Yash Marble"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:opacity-90 active:opacity-95 disabled:opacity-50 text-white font-semibold rounded-sm shadow-md shadow-primary/20 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Bypass sandbox button for fast review */}
          <div className="border-t border-slate-100 pt-4 flex flex-col items-center space-y-2">
            <span className="text-[11px] text-slate-400">No database configured? Skip to review locally.</span>
            <button
              type="button"
              onClick={handleBypass}
              className="flex items-center space-x-1.5 text-xs text-primary font-semibold hover:opacity-80 transition-all cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Sandbox Demo Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
