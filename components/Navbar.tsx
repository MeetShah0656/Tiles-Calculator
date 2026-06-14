'use client';

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
  User
} from 'lucide-react';
import { useEffect } from 'react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentTab, setCurrentTab, onLogout }: NavbarProps) {
  const { isOnline } = useJobStore();

  // Force light/white theme class on html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
  }, []);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', name: 'Calculator', icon: Calculator },
    { id: 'history', name: 'Job History', icon: History },
    { id: 'cutlist', name: 'Cut List', icon: Scissors },
    { id: 'reports', name: 'Reports', icon: FileBarChart2 },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-white font-bold text-lg shadow-sm">
            Y
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
            Yash <span className="text-primary">Marble</span>
          </span>
        </div>

        {/* Navigation Items (Desktop) */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-100 text-primary' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Settings */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div 
            title={isOnline ? 'Online - Database synced' : 'Offline - Saving locally'} 
            className="flex items-center space-x-1 text-xs"
          >
            {isOnline ? (
              <span className="flex items-center space-x-1 text-primary">
                <Wifi size={14} />
                <span className="hidden lg:inline font-medium">Online</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-amber-600">
                <WifiOff size={14} />
                <span className="hidden lg:inline font-medium">Offline</span>
              </span>
            )}
          </div>



          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 p-2 rounded-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar (Bottom Navigation for mobile-first thumb reach) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md md:hidden flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-sm text-2xs transition-all ${
                isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className="mb-0.5" />
              <span className="text-[10px]">{item.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
