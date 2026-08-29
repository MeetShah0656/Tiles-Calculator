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
      <div className="w-full bg-[#0a0a0a] text-white py-1.5 px-4 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] border-b border-neutral-800 flex justify-between items-center select-none">
        <span className="hidden sm:inline text-neutral-400">PRECISION STONE ESTIMATOR</span>
        <span className="mx-auto sm:mx-0 truncate">TIVERA PRO • 0.25 FT & 0.50 FT TRADE ROUNDING</span>
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
      <div className="md:hidden sticky top-0 z-40 w-full flex h-14 items-center justify-between px-3.5 bg-[#f4f2ee]/98 backdrop-blur-md border-b border-[#d4d1ca] shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-[#0a0a0a] p-1.5 cursor-pointer hover:bg-[#e8e6e1] active:bg-[#d4d1ca] transition-colors rounded-xs"
            aria-label="Open sidebar menu"
          >
            <Menu size={22} />
          </button>
          
          <div 
            onClick={() => setCurrentTab('dashboard')} 
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity"
          >
            <div className="flex h-7 w-7 items-center justify-center bg-[#0a0a0a] text-white font-black text-xs border border-black">
              T
            </div>
            <span className="text-base font-black tracking-[0.25em] text-[#0a0a0a] uppercase">
              TIVERA
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isPro ? (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-2.5 py-1 bg-[#0a0a0a] text-white text-[9px] font-black tracking-wider uppercase active:scale-95 transition-transform flex items-center space-x-1 border border-black"
            >
              <Sparkles size={9} className="text-white" />
              <span>PRO</span>
            </button>
          ) : (
            <span className="px-2 py-0.5 bg-[#0a0a0a] text-white text-[9px] font-black tracking-wider uppercase border border-black">
              PRO
            </span>
          )}

          <div 
            title={isOnline ? 'Online - Synced' : 'Offline - Local Mode'}
            className="p-1"
          >
            {isOnline ? (
              <span className="flex items-center text-emerald-800" title="Online">
                <Wifi size={16} />
              </span>
            ) : (
              <span className="flex items-center text-[#6b6863]" title="Offline">
                <WifiOff size={16} />
              </span>
            )}
          </div>
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
                <div className="flex h-9 w-9 items-center justify-center bg-[#0a0a0a] text-white font-black text-lg border border-black">
                  T
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-[0.3em] text-[#0a0a0a] uppercase leading-none">
                    TIVERA
                  </span>
                  <span className="text-[8px] font-bold text-[#6b6863] tracking-widest uppercase mt-1">
                    STONE ESTIMATOR
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#0a0a0a] p-1.5 cursor-pointer hover:bg-[#d4d1ca] transition-colors rounded-xs"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-3 space-y-1.5">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full text-left px-4 py-3 text-xs font-black tracking-[0.18em] uppercase transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-[#0a0a0a] text-white border-black shadow-xs' 
                        : 'text-[#6b6863] border-transparent hover:text-[#0a0a0a] hover:bg-[#e8e6e1]'
                    }`}
                  >
                    <IconComponent size={16} className={isActive ? 'text-white' : 'text-[#6b6863]'} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-[#d4d1ca] bg-[#e8e6e1] space-y-2.5">
            {!isPro && (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsUpgradeModalOpen(true);
                }}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-[#0a0a0a] text-white text-xs font-black tracking-widest uppercase cursor-pointer border border-black shadow-xs active:bg-neutral-800"
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
              className="flex items-center space-x-3 w-full px-3 py-2.5 text-xs font-bold text-[#6b6863] hover:text-[#0a0a0a] hover:bg-[#d4d1ca]/40 uppercase tracking-wider transition-colors"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f4f2ee]/98 backdrop-blur-md border-t border-[#d4d1ca] flex items-center justify-around py-1 px-1 shadow-lg">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#0a0a0a] font-black scale-105' 
                  : 'text-[#6b6863] hover:text-[#0a0a0a]'
              }`}
            >
              <div className={`p-1 rounded-xs transition-colors ${isActive ? 'bg-[#0a0a0a] text-white' : ''}`}>
                <IconComponent size={18} />
              </div>
              <span className={`text-[9px] tracking-wider uppercase mt-0.5 ${isActive ? 'font-black text-[#0a0a0a]' : 'font-semibold text-[#6b6863]'}`}>
                {item.id === 'granite-marble' ? 'Granite' : item.id === 'quota' ? 'Kota Stone' : item.name}
              </span>
            </button>
          );
        })}
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
