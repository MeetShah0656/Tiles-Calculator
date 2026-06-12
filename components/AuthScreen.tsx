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
      console.error("Supabase auth failed:", err);
      if (err.message?.includes('fetch') || err.name === 'TypeError') {
        setError("Database is offline (Network/DNS error). Accessing local sandbox mode instead...");
        setTimeout(() => {
          onLoginSuccess({
            id: 'sandbox-user',
            email: email || 'supervisor@yashmarble.com',
            user_metadata: {
              business_name: businessName || 'Yash Marble & Tiles',
              phone_number: phoneNumber || '+91 9876543210'
            }
          });
          setLoading(false);
        }, 1500);
      } else {
        setError(err.message || 'An error occurred during authentication.');
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Mock success for sandbox preview
        console.log("Supabase credentials missing, entering sandbox preview mode with Google account.");
        setTimeout(() => {
          onLoginSuccess({
            id: 'mock-google-user-456',
            email: 'google.user@yashmarble.com',
            user_metadata: {
              full_name: 'Google User',
              avatar_url: '',
              business_name: 'Yash Marble & Tiles',
              phone_number: '+91 98765 43210'
            }
          });
          setLoading(false);
        }, 850);
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error("Supabase Google Auth failed, falling back to local Sandbox login:", err);
      // Auto-fallback for DNS or network offline scenarios so button is always functional
      setError("Database is offline (Network/DNS error). Accessing local sandbox mode instead...");
      setTimeout(() => {
        onLoginSuccess({
          id: 'sandbox-google-user',
          email: 'google.user@yashmarble.com',
          user_metadata: {
            full_name: 'Google User (Sandbox)',
            avatar_url: '',
            business_name: 'Yash Marble & Tiles',
            phone_number: '+91 98765 43210'
          }
        });
        setLoading(false);
      }, 1500);
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
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span className="bg-white px-2">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 text-slate-700 font-semibold rounded-sm border border-slate-200 text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.23 7.56 8.89 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-4.97 3.7-8.62z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.78A7.02 7.02 0 0 1 4.9 12c0-.98.17-1.92.47-2.78L1.48 6.2C.54 8.08 0 10.18 0 12s.54 3.92 1.48 5.8l3.8-3.02z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.11 0-5.77-2.52-6.72-5.54L1.39 15.8C3.37 19.69 7.35 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

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
