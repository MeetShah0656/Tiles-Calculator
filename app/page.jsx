'use client';

import React, { useState, useEffect, Component } from 'react';
import Navbar from '@/components/Navbar.jsx';
import AuthScreen from '@/components/AuthScreen.jsx';
import Dashboard from '@/components/Dashboard.jsx';
import GraniteMarbleTab from '@/components/GraniteMarbleTab.jsx';
import QuotaStoneTab from '@/components/QuotaStoneTab.jsx';
import SettingsTab from '@/components/SettingsTab.jsx';
import { useJobStore } from '@/store/store.js';
import { useCubit } from '@/lib/state/Cubit';
import { authCubit } from '@/lib/state/AuthCubit';
import { subscriptionCubit } from '@/lib/state/SubscriptionCubit';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#e8e6e1] text-[#0a0a0a]">
          <div className="bg-[#f4f2ee] border border-[#d4d1ca] p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-[#0a0a0a] text-white flex items-center justify-center font-black text-xl mx-auto">
              T
            </div>
            <h2 className="text-xl font-black uppercase tracking-[0.2em]">TIVERA RECOVERY</h2>
            <p className="text-xs font-bold text-[#6b6863] uppercase tracking-wider">
              A temporary display error occurred. Click below to refresh your session.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('tivera-stone-calculator-storage');
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-[#0a0a0a] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-800 cursor-pointer border border-black"
            >
              RESET APP SESSION & RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const authState = useCubit(authCubit);
  const user = authState.user;
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMounted, setIsMounted] = useState(false);

  const activeJob = useJobStore((state) => state.activeJob);
  const quotaActiveJob = useJobStore((state) => state.quotaActiveJob);

  const rawJobToPrint = currentTab === 'quota' ? quotaActiveJob : activeJob;
  const jobToPrint = rawJobToPrint || {
    customerName: '',
    phoneNumber: '',
    siteAddress: '',
    totalArea: 0,
    totalQuantity: 0,
    grandTotal: 0,
    tiles: []
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary-accent', '#09090b');
    }
  }, []);

  useEffect(() => {
    authCubit.init();
  }, []);

  useEffect(() => {
    if (user) {
      subscriptionCubit.init();
    }
  }, [user?.id]);

  const handleLogout = () => {
    authCubit.signOut();
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e6e1] text-[#0a0a0a]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0a0a0a] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="text-xs font-black tracking-[0.3em] uppercase block">TIVERA LOADING...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} user={user} />;
      case 'granite-marble':
        return <GraniteMarbleTab />;
      case 'quota':
        return <QuotaStoneTab />;
      case 'settings':
        return <SettingsTab user={user} />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} user={user} />;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8e6e1]">
      <div className="no-print flex-grow flex flex-col">
        <Navbar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          onLogout={handleLogout} 
        />
        
        <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8">
          {renderTabContent()}
        </main>
      </div>

      <div id="printable-invoice" className="print-only p-5 bg-white text-black min-h-screen text-4xs font-sans">
        <div className="flex justify-between items-start border-b border-slate-900 pb-2">
          <div>
            <h1 className="text-xs font-extrabold tracking-tight text-slate-900 uppercase">
              {user?.user_metadata?.business_name || 'TIVERA NATURAL STONE'}
            </h1>
            <p className="text-5xs text-slate-500 mt-0.5">
              Marble, Granite, Stone, Tiles & Custom Edge Fabrication Works
            </p>
            <p className="text-5xs text-slate-400 mt-0.5">
              Contact: {user?.user_metadata?.phone_number || 'N/A'} | Email: {user?.email}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xs font-black text-slate-950 uppercase">Estimate / Quote</h2>
            <p className="text-5xs text-slate-400 mt-0.5">
              Date: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="py-2 border-b border-slate-200 text-5xs">
          <div>
            <span className="font-bold text-slate-900 uppercase block">Customer Details:</span>
            <p className="font-extrabold text-slate-900 mt-0.5">{jobToPrint.customerName || 'N/A'}</p>
            <p className="text-slate-600 mt-0.5">Phone: {jobToPrint.phoneNumber || 'N/A'}</p>
            <p className="text-slate-600 mt-0.5">Address: {jobToPrint.siteAddress || 'N/A'}</p>
          </div>
        </div>

        <div className="py-2 space-y-3">
          {(jobToPrint.tiles || []).map((tile, tIdx) => (
            <div key={tile.id || tIdx} className="space-y-1">
              <div className="flex justify-between items-center bg-slate-100 p-1 border border-slate-300">
                <span className="font-black text-4xs uppercase text-slate-900">
                  Category {tIdx + 1}: {tile.tileName || 'Unnamed Category'}
                </span>
                <span className="font-bold text-5xs text-slate-700">
                  Rate: ₹{tile.ratePerSqft}/sq ft | Subtotal: {formatCurrency(tile.subtotal)}
                </span>
              </div>

              <table className="w-full text-left border-collapse text-5xs">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-extrabold uppercase">
                    <th className="py-1 px-1.5 w-1/3">Location / Space</th>
                    <th className="py-1 px-1.5 text-center">Inches (L × W)</th>
                    <th className="py-1 px-1.5 text-center">Qty</th>
                    <th className="py-1 px-1.5 text-center">Rounded (ft)</th>
                    <th className="py-1 px-1.5 text-right">Total Sq Ft</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {(tile.rows || []).map((row, rIdx) => {
                    if (!row.lengthInches && !row.widthInches) return null;
                    return (
                      <tr key={row.id || rIdx}>
                        <td className="py-1 px-1.5 font-bold text-slate-900">{row.location || `Row ${rIdx + 1}`}</td>
                        <td className="py-1 px-1.5 text-center font-bold">{row.lengthInches}" × {row.widthInches}"</td>
                        <td className="py-1 px-1.5 text-center">{row.quantity}</td>
                        <td className="py-1 px-1.5 text-center text-slate-600">{row.roundedLengthFt}' × {row.roundedWidthFt}'</td>
                        <td className="py-1 px-1.5 text-right font-black text-slate-950">{(row.totalArea || 0).toFixed(2)} sq ft</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-2 border-t-2 border-slate-900 flex justify-between items-end">
          <div className="text-5xs text-slate-500 font-semibold space-y-0.5">
            <p>• Prices include standard tile/slab rounding allowances.</p>
            <p>• Terms: E & O.E. Payment due upon delivery.</p>
          </div>

          <div className="text-right border-l border-slate-300 pl-4">
            <div className="flex justify-between space-x-6 text-4xs font-bold text-slate-800">
              <span>Total Measure Area:</span>
              <span>{(jobToPrint.totalArea || 0).toFixed(2)} Sq Ft</span>
            </div>
            <div className="flex justify-between space-x-6 text-4xs font-bold text-slate-800">
              <span>Total Pieces:</span>
              <span>{jobToPrint.totalQuantity || 0} Pcs</span>
            </div>
            <div className="flex justify-between space-x-6 text-3xs font-black text-slate-950 pt-1 border-t border-slate-400 mt-1">
              <span>Grand Total:</span>
              <span className="text-slate-900">{formatCurrency(jobToPrint.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 flex justify-between text-5xs text-slate-400 font-bold border-t border-slate-200">
          <span>Customer Signature</span>
          <span>Authorized Signatory (TIVERA)</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppErrorBoundary>
      <MainApp />
    </AppErrorBoundary>
  );
}
