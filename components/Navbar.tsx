'use client';

import React, { useState, useEffect } from 'react';
import { useJobStore } from '@/store/store';
import { 
  Calculator, 
  History, 
  LayoutDashboard, 
  Scissors, 
  FileBarChart2, 
  Wifi, 
  WifiOff, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentTab, setCurrentTab, onLogout }: NavbarProps) {
  const { isOnline } = useJobStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Force light theme class on html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
  }, []);

  // Mobile Swipe Gesture Event Listeners
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;
      
      const diffX = e.touches[0].clientX - startX;
      const diffY = e.touches[0].clientY - startY;

      // Restrict horizontal swiping gestures
      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        // Swipe Right to Open: starts near the left screen edge (less than 50px) and moves right
        if (!isDrawerOpen && startX < 50 && diffX > 80) {
          setIsDrawerOpen(true);
          startX = 0;
          startY = 0;
        }
        // Swipe Left to Close: swiping left anywhere on the screen closes the open drawer
        else if (isDrawerOpen && diffX < -80) {
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
  }, [isDrawerOpen]);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', name: 'Calculator', icon: Calculator },
    { id: 'history', name: 'Job History', icon: History },
    { id: 'cutlist', name: 'Cut List', icon: Scissors },
    { id: 'reports', name: 'Reports', icon: FileBarChart2 },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP STICKY NAVBAR (Visible on tablet/desktop, hidden on mobile)      */}
      {/* ========================================================================= */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-white font-bold text-lg shadow-sm">
              Y
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Yash <span className="text-primary">Marble</span>
            </span>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-100 text-primary' 
                      : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Connection Status & Logout */}
          <div className="flex items-center space-x-4">
            <div 
              title={isOnline ? 'Online - Synced' : 'Offline - Local Mode'} 
              className="flex items-center space-x-1 text-xs font-semibold"
            >
              {isOnline ? (
                <span className="flex items-center space-x-1 text-primary">
                  <Wifi size={14} />
                  <span className="hidden lg:inline">Online</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-amber-600">
                  <WifiOff size={14} />
                  <span className="hidden lg:inline">Offline</span>
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 p-2 rounded-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE STICKY HEADER BAR (Visible on mobile only)                       */}
      {/* ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 w-full flex h-14 items-center justify-between px-4 bg-white border-b border-slate-200 shadow-2xs">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-slate-650 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-sm cursor-pointer transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
        
        <span className="text-base font-black tracking-tight text-slate-900">
          Yash <span className="text-primary">Marble</span>
        </span>
        
        <div className="flex items-center space-x-2 text-xs font-bold">
          {isOnline ? (
            <span className="flex items-center text-primary" title="Online - Synced">
              <Wifi size={16} />
            </span>
          ) : (
            <span className="flex items-center text-amber-600" title="Offline - Local">
              <WifiOff size={16} />
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER OVERLAY (Visible on mobile only when active)     */}
      {/* ========================================================================= */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop glass blur overlay */}
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-300" 
        />
        
        {/* Drawer panel content */}
        <div className={`absolute top-0 bottom-0 left-0 w-64 bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out border-r border-slate-200 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-250 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-white font-bold text-base shadow-sm">
                  Y
                </div>
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  Yash <span className="text-primary">Marble</span>
                </span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-sm cursor-pointer transition-colors"
                aria-label="Close sidebar menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation List */}
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
                    className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-sm text-sm font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-100 text-primary border-l-2 border-primary pl-2' 
                        : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Drawer Footer with Logout */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/30">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onLogout();
              }}
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-sm text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
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
