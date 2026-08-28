'use client';

import { 
  Calculator, 
  Settings, 
  PlusCircle, 
  Layers, 
  Box
} from 'lucide-react';

export default function Dashboard({ setCurrentTab, user }) {
  const quickActions = [
    {
      id: 'granite-marble',
      name: 'Granite & Marble',
      description: 'Slab calculators with 0.25 ft rounding & AI paper sheet scanner',
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
      name: 'Settings',
      description: 'Business profile info, account details & preferences',
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
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">TIVERA Natural Stone Suite</span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-0.5">
            Welcome, <span className="text-zinc-300">{user?.user_metadata?.business_name || 'TIVERA Partner'}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Logged in as <span className="font-bold text-white">{user?.email || 'Supervisor'}</span> | Marble, Granite & Kota Stone Calculators.
          </p>
        </div>
        <button
          onClick={() => setCurrentTab('granite-marble')}
          className="flex items-center space-x-2 bg-white hover:bg-zinc-200 text-zinc-950 font-black px-4 py-2.5 rounded-sm shadow-sm text-xs uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto justify-center border border-zinc-300"
        >
          <PlusCircle size={16} />
          <span>New Granite Estimate</span>
        </button>
      </div>

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
    </div>
  );
}
