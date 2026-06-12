'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import ActiveJobCalculator from '@/components/ActiveJobCalculator';
import JobHistory from '@/components/JobHistory';
import CutListTab from '@/components/CutListTab';
import ReportsTab from '@/components/ReportsTab';
import { useJobStore } from '@/store/store';
import { Printer, FileText } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const activeJob = useJobStore((state) => state.activeJob);

  // Sync online status changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => useJobStore.getState().setOnline(true);
      const handleOffline = () => useJobStore.getState().setOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Recover active session on mount & subscribe to changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkSession = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }

        // Listen for auth state changes (e.g., sign in, sign out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
          }
        });

        unsubscribe = () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Failed to recover session:", err);
      }
    };

    checkSession();

    return () => {
      if (unsubscribe) unsubscribe();
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

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} user={user} />;
      case 'calculator':
        return <ActiveJobCalculator />;
      case 'history':
        return <JobHistory setCurrentTab={setCurrentTab} />;
      case 'cutlist':
        return <CutListTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} user={user} />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Interactive App Shell (Hidden when printing) */}
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

      {/* High-Fidelity Printable Invoice Layout (Only active during print rendering) */}
      <div id="printable-invoice" className="print-only p-8 bg-white text-black min-h-screen text-xs font-sans">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
              {user?.user_metadata?.business_name || 'YASH MARBLE & TILES'}
            </h1>
            <p className="text-2xs text-slate-500 mt-0.5">
              Marble, Granite, Stone, Tiles & Custom Edge Fabrication Works
            </p>
            <p className="text-3xs text-slate-400 mt-1">
              Contact: {user?.user_metadata?.phone_number || 'N/A'} | Email: {user?.email}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-black text-slate-950 uppercase">Estimate / Quote</h2>
            <p className="text-3xs text-slate-400 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Client & Project Details */}
        <div className="grid grid-cols-2 gap-4 mt-4 p-3 border border-slate-200 rounded-sm bg-slate-50/50">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Customer Details</span>
            <p className="font-extrabold text-slate-900 mt-0.5">{activeJob.customerName || 'N/A'}</p>
            {activeJob.phoneNumber && <p className="text-3xs text-slate-500 mt-0.5">Phone: {activeJob.phoneNumber}</p>}
            {activeJob.siteAddress && <p className="text-3xs text-slate-500 mt-0.5">Site: {activeJob.siteAddress}</p>}
          </div>
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Project Details</span>
            <p className="font-extrabold text-slate-900 mt-0.5">{activeJob.projectName || 'N/A'}</p>
            {activeJob.notes && <p className="text-3xs text-slate-500 mt-0.5 italic">Notes: "{activeJob.notes}"</p>}
          </div>
        </div>

        {/* Measurements List Table */}
        {activeJob.tiles.map((tile, tIdx) => (
          <div key={tile.id || tIdx} className="mt-6">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase mb-1.5 bg-slate-100 p-2 border border-slate-205 rounded-sm">
              {tile.tileName || `Tile Group ${tIdx + 1}`} &mdash; ₹{tile.ratePerSqft}/sq ft
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[9px]">
                  <th className="p-2 border border-slate-200 text-center w-8">#</th>
                  <th className="p-2 border border-slate-200">Location</th>
                  <th className="p-2 border border-slate-200">Length (in)</th>
                  <th className="p-2 border border-slate-200">Width (in)</th>
                  <th className="p-2 border border-slate-200 text-center">Qty</th>
                  <th className="p-2 border border-slate-200">Rounded Length (ft)</th>
                  <th className="p-2 border border-slate-200">Rounded Width (ft)</th>
                  <th className="p-2 border border-slate-200 text-right">Area/Piece (sq ft)</th>
                  <th className="p-2 border border-slate-200 text-right">Total Area (sq ft)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tile.rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{row.location || '-'}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{row.lengthInches || '-'}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{row.widthInches || '-'}</td>
                    <td className="p-2 border border-slate-200 text-center font-semibold">{row.quantity}</td>
                    <td className="p-2 border border-slate-200">{row.roundedLengthFt > 0 ? `${row.roundedLengthFt.toFixed(2)} ft` : '-'}</td>
                    <td className="p-2 border border-slate-200">{row.roundedWidthFt > 0 ? `${row.roundedWidthFt.toFixed(2)} ft` : '-'}</td>
                    <td className="p-2 border border-slate-200 text-right font-medium">{row.areaPerPiece > 0 ? row.areaPerPiece.toFixed(2) : '-'}</td>
                    <td className="p-2 border border-slate-200 text-right font-bold">{row.totalArea > 0 ? row.totalArea.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end text-2xs font-bold text-slate-700 mt-1.5 pr-1 space-x-4">
              <span>Total Area: {tile.totalArea.toFixed(2)} sq ft</span>
              <span>Subtotal: {formatCurrency(tile.subtotal)}</span>
            </div>
          </div>
        ))}

        {/* Pricing Summary */}
        <div className="flex justify-end mt-6">
          <div className="w-1/2 space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
            <div className="flex justify-between font-medium text-slate-500">
              <span>Total Area (All Tiles):</span>
              <span className="font-extrabold text-slate-900">{activeJob.totalArea.toFixed(2)} sq ft</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
              <span>Grand Total:</span>
              <span className="text-primary font-extrabold">{formatCurrency(activeJob.grandTotal)}</span>
            </div>
          </div>
        </div>
        {/* Footer Disclaimers */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>This is a computer-generated quote. Running dimensions rounded to the nearest 0.25 ft increment.</p>
          <p className="mt-1 font-semibold text-slate-600">&copy; {user?.user_metadata?.business_name || 'TileSuite'} &bull; Thank you for your business!</p>
        </div>
      </div>

    </div>
  );
}
