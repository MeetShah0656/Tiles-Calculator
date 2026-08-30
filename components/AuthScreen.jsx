'use client';

import { useState } from 'react';
import { Mail, Lock, Building2, Phone } from 'lucide-react';
import { authCubit } from '@/lib/state/AuthCubit';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const result = await authCubit.signInWithGoogle();
    if (!result.ok) {
      setError(result.error || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
    // On success, signInWithGoogle() navigates away to Google — no further action needed here.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isLogin
      ? await authCubit.signIn(email, password)
      : await authCubit.signUp(email, password, businessName, phoneNumber);

    if (!result.ok) {
      setError(result.error || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-3.5 sm:p-6 bg-[#e8e6e1] animate-fadeIn">
      {/* Top Brand Bar */}
      <div className="mb-5 sm:mb-6 text-center space-y-1">
        <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center bg-[#0a0a0a] text-white font-black text-xl sm:text-2xl shadow-lg border border-black mb-1.5 sm:mb-2">
          T
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
          TIVERA
        </h1>
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#6b6863] block">
          NATURAL STONE & TILES ESTIMATOR
        </span>
      </div>

      <div className="w-full max-w-md bg-[#f4f2ee] border border-[#d4d1ca] shadow-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
        <div className="text-center space-y-1 border-b border-[#d4d1ca] pb-3.5">
          <h2 className="text-xs sm:text-sm font-black text-[#0a0a0a] tracking-[0.18em] sm:tracking-[0.2em] uppercase">
            {isLogin ? 'ACCOUNT SIGN IN' : 'CREATE PRO ACCOUNT'}
          </h2>
          <p className="text-[10px] font-bold text-[#6b6863] uppercase tracking-wider">
            {isLogin ? 'Sign in to access your estimates and calculator workspace.' : 'Create an account for your stone business.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#0a0a0a] text-white border border-black text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 py-3 bg-[#f4f2ee] hover:bg-[#e8e6e1] active:bg-[#d4d1ca] text-[#0a0a0a] font-black text-xs border border-[#0a0a0a] transition-all cursor-pointer uppercase tracking-[0.15em] sm:tracking-[0.2em] active:scale-98 shadow-2xs"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>CONTINUE WITH GOOGLE</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#d4d1ca] w-full"></div>
          <span className="bg-[#f4f2ee] px-3 text-[9px] sm:text-[10px] font-black uppercase text-[#6b6863] tracking-widest absolute">OR EMAIL</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Business Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                    <Building2 size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. TIVERA Natural Stone"
                    className="w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                    <Phone size={14} />
                  </div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                <Mail size={14} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meetshah0656@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black text-xs shadow-md transition-all cursor-pointer border border-black uppercase tracking-[0.18em] sm:tracking-[0.2em] active:scale-98"
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[11px] sm:text-xs font-black text-[#0a0a0a] uppercase tracking-wider hover:underline cursor-pointer"
          >
            {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
          </button>
        </div>
      </div>
    </div>
  );
}
