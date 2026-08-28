'use client';

import { useState } from 'react';
import { 
  Calculator, 
  Settings, 
  PlusCircle, 
  Layers, 
  Box,
  Sparkles,
  CreditCard,
  Check
} from 'lucide-react';
import { useJobStore } from '@/store/store.js';
import UpgradeProModal from '@/components/UpgradeProModal.jsx';

export default function Dashboard({ setCurrentTab, user }) {
  const subscription = useJobStore((state) => state.subscription);
  const isPro = subscription?.isPro || false;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const quickActions = [
    {
      id: 'granite-marble',
      name: 'Granite & Marble',
      description: 'Slab calculators with 0.25 ft rounding & paper sheet scanner',
      icon: Layers,
      color: 'bg-zinc-950 text-white border-zinc-800',
      action: () => setCurrentTab('granite-marble')
    },
    {
      id: 'quota',
      name: 'Kota Stone (Quota)',
      description: 'Kota stone calculators with 0.50 ft rounding & size presets',
      icon: Box,
      color: 'bg-zinc-900 text-white border-zinc-800',
      action: () => setCurrentTab('quota')
    },
    {
      id: 'settings',
      name: 'Settings & Billing',
      description: 'Business profile info, Tivera Pro subscription & preferences',
      icon: Settings,
      color: 'bg-zinc-100 text-zinc-950 border-zinc-300',
      action: () => setCurrentTab('settings')
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-6 rounded-sm text-white border border-zinc-800 shadow-md">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">TIVERA Natural Stone Suite</span>
            {isPro ? (
              <span className="px-2 py-0.5 bg-white text-zinc-950 text-3xs font-black rounded-2xs uppercase flex items-center space-x-1">
                <Sparkles size={10} className="text-amber-500" />
                <span>Pro Member</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-3xs font-bold rounded-2xs uppercase">
                Free Plan
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome, <span className="text-zinc-300">{user?.user_metadata?.business_name || 'TIVERA Partner'}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Logged in as <span className="font-bold text-white">{user?.email || 'Supervisor'}</span> | Marble, Granite & Kota Stone Calculators.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!isPro && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-zinc-950 font-black px-4 py-2.5 rounded-sm shadow-sm text-xs uppercase tracking-wider transition-all cursor-pointer border border-zinc-300"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Upgrade to Tivera Pro</span>
            </button>
          )}

          <button
            onClick={() => setCurrentTab('granite-marble')}
            className="flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white font-black px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider transition-all cursor-pointer border border-zinc-700"
          >
            <PlusCircle size={16} />
            <span>New Granite Estimate</span>
          </button>
        </div>
      </div>

      {/* Subscription Card Banner */}
      {!isPro && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 rounded-sm border border-zinc-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-3xs font-black uppercase tracking-widest border border-amber-300/30">
              <Sparkles size={12} />
              <span>TIVERA PRO SUBSCRIPTION</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white uppercase">
              Unlock Unlimited Sheet Scanning & Item Rows
            </h3>
            <p className="text-xs text-zinc-400 font-semibold">
              Currently on Free plan (limited to 5 scanned items & 5 manual rows per job). Upgrade to Tivera Pro for unlimited commercial estimates.
            </p>
          </div>

          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-6 py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs rounded-sm shadow-lg uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border border-zinc-300 flex items-center space-x-2"
          >
            <CreditCard size={16} />
            <span>Subscribe for ₹499/mo</span>
          </button>
        </div>
      )}

      {/* Quick Access Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-zinc-950 uppercase tracking-wider pl-2 border-l-2 border-zinc-950">
          Main Workspaces
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.action}
                className="flex flex-col items-start p-5 bg-white border border-zinc-200 hover:border-zinc-950 rounded-sm shadow-2xs hover:shadow-md transition-all duration-200 text-left group cursor-pointer"
              >
                <div className={`p-2.5 rounded-sm border ${act.color} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-black text-base text-zinc-950 mt-4 group-hover:text-zinc-800 transition-colors">
                  {act.name}
                </h3>
                <p className="text-2xs text-zinc-500 mt-1 font-medium">
                  {act.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
