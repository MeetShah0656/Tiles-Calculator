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
  X
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, onLogout }) {
  const { isOnline } = useJobStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isDrawerOpenRef = useRef(isDrawerOpen);
  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
  }, []);

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!startX || !startY) return;
      
      const diffX = e.touches[0].clientX - startX;
      const diffY = e.touches[0].clientY - startY;

      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        const open = isDrawerOpenRef.current;
        if (!open && startX < 50 && diffX > 80) {
          setIsDrawerOpen(true);
          startX = 0;
          startY = 0;
        } else if (open && diffX < -80) {
          setIsDrawerOpen(false);
          startX = 0;
          startY = 0;
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'granite-marble', name: 'Granite / Marble', icon: Layers },
    { id: 'quota', name: 'Quota', icon: Box },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP STICKY NAVBAR */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* TIVERA Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-zinc-950 text-white font-black text-lg shadow-sm border border-zinc-800">
              T
            </div>
            <span className="text-xl font-black tracking-tight text-zinc-900 uppercase">
              TIVERA
            </span>
          </div>

          {/* Navigation Items (4 Main Tabs) */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-sm text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-900 text-white shadow-xs font-black' 
                      : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Connection Status & Logout */}
          <div className="flex items-center space-x-3">
            <div 
              title={isOnline ? 'Online - Synced' : 'Offline - Local Mode'} 
              className="flex items-center text-xs font-semibold"
            >
              {isOnline ? (
                <span className="flex items-center text-zinc-900">
                  <Wifi size={16} />
                </span>
              ) : (
                <span className="flex items-center text-zinc-500">
                  <WifiOff size={16} />
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 p-2 rounded-sm text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-all duration-200 cursor-pointer"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE STICKY HEADER BAR */}
      <div className="md:hidden sticky top-0 z-40 w-full flex h-14 items-center justify-between px-4 bg-white border-b border-zinc-200 shadow-2xs">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-zinc-700 hover:text-zinc-950 p-2 hover:bg-zinc-100 rounded-sm cursor-pointer transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        
        <span 
          onClick={() => setCurrentTab('dashboard')} 
          className="text-base font-black tracking-tight text-zinc-950 uppercase cursor-pointer"
        >
          TIVERA
        </span>
        
        <div className="flex items-center space-x-2 text-xs font-bold">
          {isOnline ? (
            <span className="flex items-center text-zinc-900" title="Online - Synced">
              <Wifi size={16} />
            </span>
          ) : (
            <span className="flex items-center text-zinc-500" title="Offline - Local">
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
          style={{ touchAction: 'none' }}
        />
        
        <div 
          className={`absolute top-0 bottom-0 left-0 w-64 bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out border-r border-zinc-200 ${
            isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ touchAction: 'pan-y' }}
        >
          <div>
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-zinc-950 text-white font-black text-base shadow-sm">
                  T
                </div>
                <span className="text-base font-black tracking-tight text-zinc-950 uppercase">
                  TIVERA
                </span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 p-1.5 hover:bg-zinc-100 rounded-sm cursor-pointer transition-colors"
                aria-label="Close sidebar menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-950 text-white border-l-2 border-zinc-950 font-black' 
                        : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onLogout();
              }}
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-sm text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
