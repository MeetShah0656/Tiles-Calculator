'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Palette, Check, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

interface ProfileTabProps {
  user: any;
  onProfileUpdate: (updatedUser: any) => void;
}

export default function ProfileTab({ user, onProfileUpdate }: ProfileTabProps) {
  const [businessName, setBusinessName] = useState(user?.user_metadata?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone_number || '');
  const [accentColor, setAccentColor] = useState(user?.user_metadata?.accent_color || '#6e2020');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.user_metadata) {
      setBusinessName(user.user_metadata.business_name || '');
      setPhoneNumber(user.user_metadata.phone_number || '');
      setAccentColor(user.user_metadata.accent_color || '#6e2020');
    }
  }, [user?.id]);

  // Apply preview accent color in real-time
  const handleAccentChange = (val: string) => {
    setAccentColor(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      document.documentElement.style.setProperty('--primary-accent', val);
    }
  };

  const handleResetColor = () => {
    const defaultColor = '#6e2020';
    setAccentColor(defaultColor);
    document.documentElement.style.setProperty('--primary-accent', defaultColor);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate Hex Code format
    if (!/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      setErrorMsg("Invalid accent color. Please provide a valid 6-character hex code (e.g., #6E2020).");
      setIsSaving(false);
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials missing. Profile changes saved locally only.");
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upsert to user profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_name: businessName,
          phone_number: phoneNumber,
          accent_color: accentColor
        });

      if (error) throw error;

      // Update auth user metadata so the active session holds the fresh data
      const { data: { user: updatedAuthUser }, error: authError } = await supabase.auth.updateUser({
        data: {
          business_name: businessName,
          phone_number: phoneNumber,
          accent_color: accentColor
        }
      });

      if (authError) throw authError;

      // Call parent update callback to sync state globally
      onProfileUpdate(updatedAuthUser || {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          business_name: businessName,
          phone_number: phoneNumber,
          accent_color: accentColor
        }
      });

      setSuccessMsg("Profile and custom accent theme successfully saved!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Profile update failed:", err);
      setErrorMsg(err.message || "An error occurred while updating your profile settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-sm shadow-sm p-5 sm:p-8 animate-fadeIn">
      {/* Tab Title */}
      <div className="border-b border-slate-200 pb-4 mb-6">
        <span className="text-[10px] uppercase font-black text-primary tracking-wider">Account Settings</span>
        <h2 className="text-xl font-black text-slate-900 mt-0.5">Profile Management</h2>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">Customize your business details and personalize your dashboard color scheme.</p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs flex items-center space-x-2 animate-fadeIn font-semibold">
          <Check size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm text-xs flex items-start space-x-2 animate-fadeIn font-semibold">
          <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Read-only info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
            {user?.email?.slice(0, 2) || 'US'}
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged In Account</span>
            <span className="font-extrabold text-slate-800 text-sm">{user?.email}</span>
          </div>
        </div>

        {/* Business details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-2 border-primary pl-2">Business Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessName" className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Business Name
              </label>
              <div className="relative rounded-sm shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase size={14} />
                </div>
                <input
                  type="text"
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-xs text-slate-800 font-bold bg-white"
                  placeholder="e.g. Yash Marble & Tiles"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative rounded-sm shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={14} />
                </div>
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-xs text-slate-800 font-bold bg-white"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Theme Customization */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-2 border-primary pl-2">
              Color Theme (Primary Accent)
            </h3>
            <button
              type="button"
              onClick={handleResetColor}
              className="text-2xs font-extrabold text-slate-450 hover:text-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset to Crimson</span>
            </button>
          </div>

          <div className="bg-slate-50/50 border border-slate-150 rounded-sm p-4 space-y-4">
            <div className="flex items-center space-x-4">
              {/* Native Color Picker Box */}
              <div className="relative w-12 h-12 rounded-sm border border-slate-300 overflow-hidden shadow-xs cursor-pointer flex-shrink-0">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => handleAccentChange(e.target.value)}
                  className="absolute inset-[-6px] w-[60px] h-[60px] p-0 border-none cursor-pointer"
                />
              </div>

              {/* Hex Code Input Field */}
              <div className="flex-grow">
                <label htmlFor="accentColor" className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Hex Code Color
                </label>
                <div className="relative w-full max-w-[180px] rounded-sm shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-black text-xs">
                    #
                  </div>
                  <input
                    type="text"
                    id="accentColor"
                    value={accentColor.startsWith('#') ? accentColor.slice(1) : accentColor}
                    onChange={(e) => handleAccentChange('#' + e.target.value)}
                    maxLength={6}
                    className="block w-full pl-6 pr-3 py-1.5 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm text-xs text-slate-800 font-bold uppercase bg-white font-mono"
                    placeholder="6E2020"
                  />
                </div>
              </div>
            </div>

            {/* Quick Palette Options */}
            <div>
              <span className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Quick Selection Palettes
              </span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { name: 'Crimson (Default)', hex: '#6e2020' },
                  { name: 'Emerald', hex: '#0f9f6e' },
                  { name: 'Ocean Blue', hex: '#1c64f2' },
                  { name: 'Slate Gray', hex: '#4b5563' },
                  { name: 'Deep Purple', hex: '#7e3af2' },
                  { name: 'Amber Gold', hex: '#d03801' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => handleAccentChange(col.hex)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm border border-slate-200 hover:border-slate-350 bg-white shadow-3xs hover:bg-slate-50 transition-all cursor-pointer"
                    title={col.name}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" 
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[10px] font-bold text-slate-600">{col.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-primary hover:opacity-95 text-white font-bold px-6 py-2.5 rounded-sm text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
