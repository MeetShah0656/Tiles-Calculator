'use client';

import { useState } from 'react';
import { 
  Sparkles,
  CreditCard,
  Check,
  ShieldCheck,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useJobStore } from '@/store/store.js';
import UpgradeProModal from '@/components/UpgradeProModal.jsx';

export default function Dashboard({ setCurrentTab, user }) {
  const subscription = useJobStore((state) => state.subscription);
  const isPro = subscription?.isPro || false;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="space-y-8 sm:space-y-10 pb-20 md:pb-16 animate-fadeIn">
      {/* HERO SECTION (GAZU EDITORIAL REFERENCE LOOK) */}
      <div className="relative bg-[#f4f2ee] border border-[#d4d1ca] p-6 sm:p-8 md:p-14 overflow-hidden shadow-xs">
        <div className="max-w-3xl space-y-3.5 sm:space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2">
            <span className="text-[9px] sm:text-3xs font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#6b6863] block">
              NATURAL STONE & TILES ESTIMATOR
            </span>
            {isPro ? (
              <span className="px-2 py-0.5 bg-[#0a0a0a] text-white text-[9px] font-black tracking-widest uppercase flex items-center space-x-1 border border-black">
                <Sparkles size={10} className="text-white" />
                <span>PRO SUITE</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[#e8e6e1] text-[#6b6863] text-[9px] font-extrabold tracking-widest uppercase border border-[#d4d1ca]">
                FREE PLAN
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase text-[#0a0a0a] leading-tight sm:leading-none">
            PRECISION THAT MOVES WITH YOU.
          </h1>

          <p className="text-xs md:text-sm font-bold text-[#6b6863] uppercase tracking-[0.12em] sm:tracking-[0.15em] max-w-xl">
            Professional Marble, Granite & Kota Stone quotation workspace. Configured with 0.25 ft and 0.50 ft trade rounding rules.
          </p>

          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <button
              onClick={() => setCurrentTab('granite-marble')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-all cursor-pointer border border-black flex items-center justify-center space-x-2 active:scale-98 shadow-xs"
            >
              <span>NEW GRANITE ESTIMATE</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setCurrentTab('quota')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent hover:bg-[#e8e6e1] text-[#0a0a0a] font-black text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-all cursor-pointer border border-[#0a0a0a] text-center active:scale-98"
            >
              <span>KOTA STONE WORKSPACE</span>
            </button>
          </div>
        </div>

        {/* Large Decorative GAZU Watermark */}
        <div className="absolute -right-4 -bottom-4 text-6xl sm:text-8xl md:text-9xl font-black text-[#e8e6e1] select-none pointer-events-none tracking-widest opacity-60 overflow-hidden">
          TIVERA
        </div>
      </div>

      {/* PRO MEMBERSHIP BANNER (GAZU DARK SECTION LOOK) */}
      {!isPro && (
        <div className="bg-[#0a0a0a] text-white p-6 sm:p-8 md:p-12 border border-black shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8">
          <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-neutral-300 block">
              NEW COLLECTION 2024 • TIVERA PRO PLAN
            </span>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase text-white leading-tight">
              UNLOCK UNLIMITED ESTIMATES & PAPER NOTE SCANNING
            </h2>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Free plan is limited to 5 items. Upgrade to Tivera Pro for unlimited commercial jobs, WhatsApp billing & instant PDF export.
            </p>
          </div>

          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-neutral-200 text-[#0a0a0a] font-black text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all cursor-pointer whitespace-nowrap shadow-lg flex items-center justify-center space-x-2 border border-white active:scale-98"
          >
            <CreditCard size={16} />
            <span>SUBSCRIBE FOR ₹499/MO</span>
          </button>
        </div>
      )}

      {/* CATEGORY WORKSPACES GRID (GAZU MEN / WOMEN / KIDS LOOK) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-[#d4d1ca] pb-3">
          <h2 className="text-xs sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#0a0a0a]">
            MAIN CATEGORY WORKSPACES
          </h2>
          <span className="text-[9px] sm:text-[10px] font-bold text-[#6b6863] uppercase tracking-widest">SELECT MODULE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {/* Card 1: Granite & Marble */}
          <div 
            onClick={() => setCurrentTab('granite-marble')}
            className="bg-[#f4f2ee] border border-[#d4d1ca] p-5 sm:p-6 hover:border-black transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[14rem] sm:h-64 shadow-2xs active:scale-[0.99]"
          >
            <div>
              <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] uppercase text-[#6b6863] block mb-1.5 sm:mb-2">
                MODULE 01
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-[#0a0a0a]">
                GRANITE & MARBLE
              </h3>
              <p className="text-xs font-bold text-[#6b6863] tracking-wider uppercase mt-2">
                Slab calculations with 0.25 ft rounding & paper sheet scanner.
              </p>
            </div>
            <div className="pt-4 border-t border-[#d4d1ca] flex items-center justify-between font-black text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#0a0a0a] group-hover:underline">
              <span>OPEN WORKSPACE</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2: Kota Stone */}
          <div 
            onClick={() => setCurrentTab('quota')}
            className="bg-[#f4f2ee] border border-[#d4d1ca] p-5 sm:p-6 hover:border-black transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[14rem] sm:h-64 shadow-2xs active:scale-[0.99]"
          >
            <div>
              <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] uppercase text-[#6b6863] block mb-1.5 sm:mb-2">
                MODULE 02
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-[#0a0a0a]">
                KOTA STONE
              </h3>
              <p className="text-xs font-bold text-[#6b6863] tracking-wider uppercase mt-2">
                Kota stone calculators with 0.50 ft rounding & size presets.
              </p>
            </div>
            <div className="pt-4 border-t border-[#d4d1ca] flex items-center justify-between font-black text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#0a0a0a] group-hover:underline">
              <span>OPEN WORKSPACE</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 3: Settings & Preferences */}
          <div 
            onClick={() => setCurrentTab('settings')}
            className="bg-[#0a0a0a] text-white border border-black p-5 sm:p-6 hover:bg-neutral-900 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[14rem] sm:h-64 shadow-2xs active:scale-[0.99]"
          >
            <div>
              <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] uppercase text-neutral-400 block mb-1.5 sm:mb-2">
                MODULE 03
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-white">
                SETTINGS & BILLING
              </h3>
              <p className="text-xs font-bold text-neutral-400 tracking-wider uppercase mt-2">
                Business profile info, Tivera Pro membership & preferences.
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between font-black text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase text-white group-hover:underline">
              <span>MANAGE ACCOUNT</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BENEFIT TICKER BAR (GAZU REFERENCE BOTTOM BAR) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-[#d4d1ca]">
        <div className="p-3.5 sm:p-4 bg-[#f4f2ee] border border-[#d4d1ca] space-y-1">
          <Zap size={18} className="text-[#0a0a0a]" />
          <h4 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#0a0a0a]">FAST SCANNERS</h4>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#6b6863] tracking-wider uppercase">Instant paper note parsing</p>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#f4f2ee] border border-[#d4d1ca] space-y-1">
          <Award size={18} className="text-[#0a0a0a]" />
          <h4 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#0a0a0a]">TRADE ROUNDING</h4>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#6b6863] tracking-wider uppercase">0.25 ft & 0.50 ft rules</p>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#f4f2ee] border border-[#d4d1ca] space-y-1">
          <ShieldCheck size={18} className="text-[#0a0a0a]" />
          <h4 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#0a0a0a]">100% ACCURATE</h4>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#6b6863] tracking-wider uppercase">Precision area formula</p>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#f4f2ee] border border-[#d4d1ca] space-y-1">
          <Check size={18} className="text-[#0a0a0a]" />
          <h4 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#0a0a0a]">PDF & WHATSAPP</h4>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#6b6863] tracking-wider uppercase">Direct customer invoices</p>
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
