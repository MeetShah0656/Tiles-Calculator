'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJobStore } from '@/store/store.js';
import { 
  LayoutDashboard, 
  Layers, 
  Box, 
  Settings, 
  Wifi, 
  WifiOff, 
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import UpgradeProModal from './UpgradeProModal.jsx';

export default function Navbar({ currentTab, setCurrentTab, onLogout }) {
  const isOnline = useJobStore((state) => state.isOnline);
  const subscription = useJobStore((state) => state.subscription);
  const isPro = subscription?.isPro || false;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isDrawerOpenRef = useRef(isDrawerOpen);
  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'granite-marble', name: 'Granite & Marble', icon: Layers },
    { id: 'quota', name: 'Kota Stone', icon: Box },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR (GAZU REFERENCE STYLE) */}
      <div className="w-full bg-[#0a0a0a] text-white py-2 px-6 text-center text-[10px] font-black uppercase tracking-[0.25em] border-b border-neutral-800 flex justify-between items-center">
        <span className="hidden sm:inline text-neutral-400">PRECISION STONE ESTIMATOR</span>
        <span className="mx-auto sm:mx-0">TIVERA PRO SUITE • 0.25 FT & 0.50 FT TRADE ROUNDING</span>
        <span className="hidden sm:inline text-neutral-400">INSTANT INVOICING</span>
      </div>

      {/* DESKTOP STICKY NAVBAR */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b border-[#d4d1ca] bg-[#f4f2ee]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* TIVERA Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="flex h-10 w-10 items-center justify-center bg-[#0a0a0a] text-white font-black text-xl border border-black shadow-xs">
              T
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black tracking-[0.3em] text-[#0a0a0a] uppercase group-hover:opacity-80 transition-opacity">
                TIVERA
              </span>
              {isPro ? (
                <span className="px-2 py-0.5 bg-[#0a0a0a] text-white text-[9px] font-black tracking-widest uppercase">
                  PRO
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-[#e8e6e1] text-[#6b6863] text-[9px] font-extrabold tracking-widest uppercase border border-[#d4d1ca]">
                  FREE
                </span>
              )}
            </div>
          </div>

          {/* Navigation Items (GAZU Editorial Style) */}
          <nav className="flex items-center space-x-8 h-full">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`py-2 text-xs font-black tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-[#0a0a0a] border-b-2 border-[#0a0a0a]' 
                      : 'text-[#6b6863] hover:text-[#0a0a0a] hover:border-b-2 hover:border-[#6b6863]'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Pro Badge & Connection Status & Logout */}
          <div className="flex items-center space-x-4">
            {!isPro ? (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0a0a0a] text-white hover:bg-neutral-800 text-xs font-black tracking-widest uppercase transition-all cursor-pointer border border-black shadow-xs"
              >
                <Sparkles size={12} className="text-neutral-300" />
                <span>UPGRADE TO PRO</span>
              </button>
            ) : (
              <span className="px-3 py-1 bg-[#0a0a0a] text-white text-[10px] font-black tracking-widest uppercase flex items-center space-x-1 border border-black">
                <Sparkles size={12} className="text-neutral-300" />
                <span>PRO ACTIVE</span>
              </span>
            )}

            <div 
              title={isOnline ? 'Online - Synced' : 'Offline - Local Mode'} 
              className="flex items-center text-xs font-semibold"
            >
              {isOnline ? (
                <span className="flex items-center text-[#0a0a0a]">
                  <Wifi size={16} />
                </span>
              ) : (
                <span className="flex items-center text-[#6b6863]">
                  <WifiOff size={16} />
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 p-2 text-[#6b6863] hover:text-[#0a0a0a] transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE STICKY HEADER BAR */}
      <div className="md:hidden sticky top-0 z-40 w-full flex h-16 items-center justify-between px-4 bg-[#f4f2ee] border-b border-[#d4d1ca]">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-[#0a0a0a] p-2 cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        
        <span 
          onClick={() => setCurrentTab('dashboard')} 
          className="text-lg font-black tracking-[0.3em] text-[#0a0a0a] uppercase cursor-pointer"
        >
          TIVERA
        </span>
        
        <div className="flex items-center space-x-2">
          {!isPro && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-2.5 py-1 bg-[#0a0a0a] text-white text-[10px] font-black tracking-widest uppercase"
            >
              PRO
            </button>
          )}
          {isOnline ? (
            <span className="flex items-center text-[#0a0a0a]">
              <Wifi size={16} />
            </span>
          ) : (
            <span className="flex items-center text-[#6b6863]">
              <WifiOff size={16} />
            </span>
          )}
        </div>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-2xs transition-opacity duration-300" 
        />
        
        <div 
          className={`absolute top-0 bottom-0 left-0 w-72 bg-[#f4f2ee] shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out border-r border-[#d4d1ca] ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between p-5 border-b border-[#d4d1ca] bg-[#e8e6e1]">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center bg-[#0a0a0a] text-white font-black text-lg">
                  T
                </div>
                <span className="text-lg font-black tracking-[0.3em] text-[#0a0a0a] uppercase">
                  TIVERA
                </span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#0a0a0a] p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-xs font-black tracking-[0.2em] uppercase transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#0a0a0a] text-white' 
                        : 'text-[#6b6863] hover:text-[#0a0a0a] hover:bg-[#e8e6e1]'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-5 border-t border-[#d4d1ca] bg-[#e8e6e1] space-y-3">
            {!isPro && (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsUpgradeModalOpen(true);
                }}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-[#0a0a0a] text-white text-xs font-black tracking-widest uppercase cursor-pointer"
              >
                <Sparkles size={14} className="text-neutral-300" />
                <span>UPGRADE TO PRO</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onLogout();
              }}
              className="flex items-center space-x-3 w-full px-3 py-2.5 text-xs font-bold text-[#6b6863] hover:text-[#0a0a0a] uppercase tracking-wider"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
