'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Check, AlertTriangle, RefreshCw, Cloud, ShieldCheck } from 'lucide-react';
import { useJobStore } from '@/store/store.js';

export default function SettingsTab({ user, onProfileUpdate }) {
  const [businessName, setBusinessName] = useState(user?.user_metadata?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone_number || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isOnline = useJobStore((state) => state.isOnline);
  const jobs = useJobStore((state) => state.jobs);
  const syncPendingJobs = useJobStore((state) => state.syncPendingJobs);
  const fetchJobsFromCloud = useJobStore((state) => state.fetchJobsFromCloud);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setBusinessName(user.user_metadata.business_name || '');
      setPhoneNumber(user.user_metadata.phone_number || '');
    }
  }, [user?.id]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingJobs();
      await fetchJobsFromCloud();
      setSuccessMsg("Cloud synchronization completed successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("Cloud sync failed. Check connection or Supabase settings.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials missing. Profile changes saved locally only.");
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_name: businessName,
          phone_number: phoneNumber
        });

      if (error) throw error;

      const { data: { user: updatedAuthUser }, error: authError } = await supabase.auth.updateUser({
        data: {
          business_name: businessName,
          phone_number: phoneNumber
        }
      });

      if (authError) throw authError;

      onProfileUpdate(updatedAuthUser || {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          business_name: businessName,
          phone_number: phoneNumber
        }
      });

      setSuccessMsg("Business profile successfully updated!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Profile update failed:", err);
      setErrorMsg(err.message || "An error occurred while updating settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      <div className="bg-white border border-zinc-200 rounded-sm shadow-xs p-6">
        <div className="border-b border-zinc-200 pb-4 mb-6">
          <span className="text-[10px] uppercase font-black text-zinc-950 tracking-widest">TIVERA Preferences</span>
          <h1 className="text-2xl font-black text-zinc-950 mt-0.5">Settings</h1>
          <p className="text-xs font-semibold text-zinc-500 mt-0.5">
            Manage your business profile info and cloud database synchronization.
          </p>
        </div>

        {successMsg && (
          <div className="mb-5 p-3 bg-zinc-900 text-white rounded-sm text-xs flex items-center space-x-2 font-semibold shadow-xs">
            <Check size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm text-xs flex items-start space-x-2 font-semibold">
            <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Notice: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-black uppercase text-sm border border-zinc-800">
                {user?.email?.slice(0, 2) || 'TV'}
              </div>
              <div>
                <span className="block text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider">Logged In Account</span>
                <span className="font-black text-zinc-950 text-sm">{user?.email || 'TIVERA User'}</span>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-3xs font-black uppercase tracking-wider bg-zinc-950 text-white border border-zinc-800">
              <ShieldCheck size={12} className="mr-1" /> Active Session
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wider border-l-2 border-zinc-950 pl-2">
              Business Profile Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="businessName" className="block text-2xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Business Name / Company Title
                </label>
                <div className="relative rounded-sm shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                    <Briefcase size={14} />
                  </div>
                  <input
                    type="text"
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-sm text-xs text-zinc-950 font-bold bg-white"
                    placeholder="e.g. TIVERA Natural Stone"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-2xs font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative rounded-sm shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-sm text-xs text-zinc-950 font-bold bg-white"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-zinc-200">
            <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wider border-l-2 border-zinc-950 pl-2">
              Cloud Database & Storage
            </h3>
            
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Cloud size={16} className="text-zinc-900" />
                  <span className="font-extrabold text-xs text-zinc-950">
                    Network Connection: {isOnline ? 'Online (Connected)' : 'Offline (Local Only)'}
                  </span>
                </div>
                <p className="text-3xs text-zinc-500 font-semibold">
                  Saved estimates: <strong className="text-zinc-900">{jobs.length} total</strong> ({jobs.filter(j => j.syncStatus === 'pending_sync').length} pending sync)
                </p>
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center space-x-1.5 bg-zinc-950 hover:bg-black text-white text-2xs font-extrabold px-3 py-2 rounded-sm shadow-xs disabled:opacity-40 transition-all cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Data'}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-zinc-950 hover:bg-black text-white font-bold px-6 py-2.5 rounded-sm text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer border border-zinc-800 uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving Settings...</span>
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
    </div>
  );
}
