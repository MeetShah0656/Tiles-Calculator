'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar.jsx';
import AuthScreen from '@/components/AuthScreen.jsx';
import Dashboard from '@/components/Dashboard.jsx';
import GraniteMarbleTab from '@/components/GraniteMarbleTab.jsx';
import QuotaStoneTab from '@/components/QuotaStoneTab.jsx';
import SettingsTab from '@/components/SettingsTab.jsx';
import { useJobStore } from '@/store/store.js';

export default function Home() {
  const [user, setUser] = useState(null);
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
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        const storeState = useJobStore.getState();
        if (storeState && typeof storeState.setIsOnline === 'function') {
          storeState.setIsOnline(true);
        }
      };
      const handleOffline = () => {
        const storeState = useJobStore.getState();
        if (storeState && typeof storeState.setIsOnline === 'function') {
          storeState.setIsOnline(false);
        }
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    let authListenerObj = null;

    const checkSession = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const mergeUserProfile = async (authUser) => {
          if (!authUser) return null;
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            if (prof) {
              return {
                ...authUser,
                user_metadata: {
                  ...authUser.user_metadata,
                  business_name: prof.business_name || authUser.user_metadata?.business_name,
                  phone_number: prof.phone_number || authUser.user_metadata?.phone_number
                }
              };
            }
          } catch (e) {
            console.error("Failed to merge profile:", e);
          }
          return authUser;
        };
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const merged = await mergeUserProfile(sessionData.session.user);
          setUser(merged);
        }

        const { data: listenerData } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const merged = await mergeUserProfile(session.user);
            setUser(merged);
          } else {
            setUser(null);
          }
        });

        authListenerObj = listenerData?.subscription;
      } catch (err) {
        console.error("Failed to recover session:", err);
      }
    };

    checkSession();

    return () => {
      if (authListenerObj && typeof authListenerObj.unsubscribe === 'function') {
        try {
          authListenerObj.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing auth listener:", e);
        }
      }
    };
  }, []);

  const handleLogout = async () => {
    setUser(null);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to sign out from Supabase:", err);
    }
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
    return <AuthScreen onLoginSuccess={setUser} />;
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
        return <SettingsTab user={user} onProfileUpdate={setUser} />;
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
