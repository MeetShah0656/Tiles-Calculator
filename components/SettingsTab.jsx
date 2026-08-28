'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Check, AlertTriangle, RefreshCw, Cloud, ShieldCheck, Sparkles, CreditCard, ShieldAlert } from 'lucide-react';
import { useJobStore } from '@/store/store.js';
import UpgradeProModal from '@/components/UpgradeProModal.jsx';

export default function SettingsTab({ user, onProfileUpdate }) {
  const [businessName, setBusinessName] = useState(user?.user_metadata?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone_number || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isOnline = useJobStore((state) => state.isOnline);
  const jobs = useJobStore((state) => state.jobs);
  const subscription = useJobStore((state) => state.subscription);
  const isPro = subscription?.isPro || false;
  
  const activateProSubscription = useJobStore((state) => state.activateProSubscription);
  const cancelProSubscription = useJobStore((state) => state.cancelProSubscription);

  const syncPendingJobs = useJobStore((state) => state.syncPendingJobs);
  const fetchJobsFromCloud = useJobStore((state) => state.fetchJobsFromCloud);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setBusinessName(user.user_metadata.business_name || '');
      setPhoneNumber(user.user_metadata.phone_number || '');
    }
  }, [user?.id]);

  const handleToggleAdminProStatus = () => {
    if (isPro) {
      cancelProSubscription();
      setSuccessMsg("User status manually set to FREE TIER.");
    } else {
      activateProSubscription({
        paymentId: 'admin_manual_override_' + Date.now(),
        planName: 'Tivera Pro (Admin Manual Grant)'
      });
      setSuccessMsg("User status manually upgraded to TIVERA PRO!");
    }
    setTimeout(() => setSuccessMsg(null), 4000);
  };

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
      <div className="bg-[#f4f2ee] border border-[#d4d1ca] p-8">
        <div className="border-b border-[#d4d1ca] pb-4 mb-6">
          <span className="text-[10px] uppercase font-black text-[#6b6863] tracking-[0.25em]">TIVERA PREFERENCES</span>
          <h1 className="text-3xl font-black text-[#0a0a0a] tracking-[0.15em] uppercase mt-1">SETTINGS & BILLING</h1>
          <p className="text-xs font-bold text-[#6b6863] uppercase tracking-wider mt-1">
            Manage your business profile info, Razorpay subscription, and cloud database synchronization.
          </p>
        </div>

        {successMsg && (
          <div className="mb-5 p-4 bg-[#0a0a0a] text-white text-xs flex items-center space-x-2 font-black uppercase tracking-wider border border-black">
            <Check size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 font-bold uppercase tracking-wider">
            <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Subscription & Membership Box */}
          <div className="p-6 bg-[#0a0a0a] text-white border border-black space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">SUBSCRIPTION STATUS</span>
              </div>
              {isPro ? (
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest">
                  ACTIVE PRO MEMBER
                </span>
              ) : (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-black uppercase tracking-widest">
                  FREE TIER (RESTRICTED)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-neutral-800">
              <div>
                <h3 className="text-xl font-black uppercase tracking-wider">{isPro ? 'TIVERA PRO PLAN' : 'FREE TIER'}</h3>
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1">
                  {isPro 
                    ? 'Unlimited sheet scans, unlimited manual measurement rows, and custom invoice branding.' 
                    : 'Restricted features. Upgrade to Tivera Pro for unlimited commercial estimates.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {!isPro ? (
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-6 py-3 bg-white text-[#0a0a0a] hover:bg-neutral-200 text-xs font-black tracking-[0.2em] uppercase transition-all cursor-pointer whitespace-nowrap border border-white flex items-center space-x-2"
                  >
                    <CreditCard size={14} />
                    <span>UPGRADE TO PRO</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelProSubscription}
                    className="px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    DOWNGRADE TO FREE
                  </button>
                )}

                {/* Admin Manual Override Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAdminProStatus}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-black uppercase tracking-widest border border-neutral-700 transition-all cursor-pointer flex items-center space-x-1.5 justify-center"
                  title="Manually switch user status between Free & Pro without payment"
                >
                  <ShieldAlert size={12} className="text-neutral-300" />
                  <span>{isPro ? 'Set to Free (Admin)' : 'Set to Pro (Admin)'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#e8e6e1] border border-[#d4d1ca] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-[#0a0a0a] text-white flex items-center justify-center font-black uppercase text-base border border-black">
                {user?.email?.slice(0, 2) || 'TV'}
              </div>
              <div>
                <span className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest">LOGGED IN ACCOUNT</span>
                <span className="font-black text-[#0a0a0a] text-sm uppercase">{user?.email || 'TIVERA User'}</span>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white">
              <ShieldCheck size={12} className="mr-1" /> ACTIVE SESSION
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.2em] border-l-2 border-[#0a0a0a] pl-3">
              BUSINESS PROFILE DETAILS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="businessName" className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1.5">
                  Business Name / Company Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                    <Briefcase size={14} />
                  </div>
                  <input
                    type="text"
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs text-[#0a0a0a] font-bold bg-white outline-none"
                    placeholder="e.g. TIVERA Natural Stone"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b6863]">
                    <Phone size={14} />
                  </div>
                  <input
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs text-[#0a0a0a] font-bold bg-white outline-none"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#d4d1ca]">
            <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.2em] border-l-2 border-[#0a0a0a] pl-3">
              CLOUD DATABASE & STORAGE
            </h3>
            
            <div className="bg-[#e8e6e1] border border-[#d4d1ca] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Cloud size={16} className="text-[#0a0a0a]" />
                  <span className="font-black text-xs text-[#0a0a0a] uppercase tracking-wider">
                    NETWORK STATUS: {isOnline ? 'ONLINE (CONNECTED)' : 'OFFLINE (LOCAL MODE)'}
                  </span>
                </div>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-wider">
                  Saved estimates: <strong className="text-[#0a0a0a]">{jobs.length} total</strong> ({jobs.filter(j => j.syncStatus === 'pending_sync').length} pending sync)
                </p>
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center space-x-2 bg-[#0a0a0a] hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase px-4 py-2.5 disabled:opacity-40 transition-all cursor-pointer border border-black"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'SYNCING...' : 'SYNC CLOUD DATA'}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#d4d1ca] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black px-8 py-3 text-xs tracking-[0.2em] disabled:opacity-50 transition-all cursor-pointer border border-black uppercase"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>SAVE SETTINGS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
