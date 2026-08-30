'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, Check, AlertTriangle, RefreshCw, Cloud, ShieldCheck, Sparkles, CreditCard, Key, Copy, CheckCircle2, Lock } from 'lucide-react';
import { useJobStore } from '@/store/store.js';
import { useCubit } from '@/lib/state/Cubit';
import { authCubit } from '@/lib/state/AuthCubit';
import { subscriptionCubit } from '@/lib/state/SubscriptionCubit';
import UpgradeProModal from '@/components/UpgradeProModal.jsx';

export default function SettingsTab({ user }) {
  const [businessName, setBusinessName] = useState(user?.user_metadata?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone_number || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isOnline = useJobStore((state) => state.isOnline);
  const jobs = useJobStore((state) => state.jobs);

  const subState = useCubit(subscriptionCubit);
  const subscription = subState.subscription;
  const isPro = subscription?.isPro || false;
  const isRazorpaySubscription = isPro && (
    subscription?.paymentProvider === 'razorpay' ||
    (subscription?.paymentId && (subscription.paymentId.startsWith('pay_') || subscription.paymentId.startsWith('razorpay_')))
  );

  const getOrGenerateUserKey = useJobStore((state) => state.getOrGenerateUserKey);

  const userEmail = user?.email || 'meetshah0656@gmail.com';
  const [userKeyRecord, setUserKeyRecord] = useState({ key: 'TIVERA-7D-MEET-0656', isUsed: false, usedAt: null });

  useEffect(() => {
    if (getOrGenerateUserKey && userEmail) {
      try {
        const record = getOrGenerateUserKey(userEmail);
        if (record) {
          setUserKeyRecord(record);
        }
      } catch (err) {
        console.error("Failed to generate key record:", err);
      }
    }
  }, [userEmail, getOrGenerateUserKey]);

  // Authoritative redemption status now comes from the server (SubscriptionCubit,
  // backed by GET /api/subscription), not a direct client-side Supabase query.
  useEffect(() => {
    if (subscription?.keyRedeemed) {
      setUserKeyRecord((prev) => ({
        ...prev,
        key: subscription.activationKey || prev.key,
        isUsed: true,
        usedAt: subscription.activatedAt || prev.usedAt
      }));
    }
  }, [subscription?.keyRedeemed, subscription?.activationKey, subscription?.activatedAt]);

  const [inputKey, setInputKey] = useState('');
  const [keyRedeemMsg, setKeyRedeemMsg] = useState(null);
  const [keyRedeemError, setKeyRedeemError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

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

  const handleRedeemKey = async (e) => {
    e.preventDefault();
    setKeyRedeemMsg(null);
    setKeyRedeemError(null);

    const res = await subscriptionCubit.redeemKey(inputKey);
    if (res?.ok) {
      setKeyRedeemMsg(res.message);
      setInputKey('');
      if (getOrGenerateUserKey) {
        setUserKeyRecord({ ...getOrGenerateUserKey(userEmail), isUsed: true });
      }
    } else {
      setKeyRedeemError(res?.error || 'Failed to redeem key.');
    }
  };

  const handleCopyKey = () => {
    if (userKeyRecord?.key) {
      navigator.clipboard.writeText(userKeyRecord.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleDowngrade = async () => {
    if (!window.confirm("Are you sure you want to downgrade your membership to the Free Tier?")) {
      return;
    }
    setIsDowngrading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await subscriptionCubit.cancel();
      if (res?.ok) {
        setSuccessMsg("Subscription downgraded to Free Tier.");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res?.error || "Failed to downgrade subscription. Please try again.");
      }
    } catch (err) {
      console.error("Downgrade failed:", err);
      setErrorMsg("Failed to downgrade subscription. Please try again.");
    } finally {
      setIsDowngrading(false);
    }
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
      const res = await authCubit.updateProfile({ businessName, phoneNumber });
      if (!res.ok) {
        throw new Error(res.error || "An error occurred while updating settings.");
      }

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
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-12 animate-fadeIn">
      <div className="bg-[#f4f2ee] border border-[#d4d1ca] p-4 sm:p-6 md:p-8 shadow-xs">
        <div className="border-b border-[#d4d1ca] pb-4 mb-6">
          <span className="text-[9px] sm:text-[10px] uppercase font-black text-[#6b6863] tracking-[0.2em] sm:tracking-[0.25em]">TIVERA PREFERENCES</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] tracking-[0.15em] uppercase mt-1">SETTINGS & BILLING</h1>
          <p className="text-xs font-bold text-[#6b6863] uppercase tracking-wider mt-1">
            Manage your business profile info, activation key, Razorpay subscription, and cloud database synchronization.
          </p>
        </div>

        {successMsg && (
          <div className="mb-5 p-3.5 bg-[#0a0a0a] text-white text-xs flex items-center space-x-2 font-black uppercase tracking-wider border border-black">
            <Check size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 font-bold uppercase tracking-wider">
            <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Subscription & Membership Box */}
          <div className="p-4 sm:p-6 bg-[#0a0a0a] text-white border border-black space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-xs font-black uppercase tracking-[0.18em]">SUBSCRIPTION STATUS</span>
              </div>
              {isPro ? (
                <span className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest">
                  ACTIVE PRO MEMBER
                </span>
              ) : (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-300 text-[9px] font-black uppercase tracking-widest">
                  FREE TIER (RESTRICTED)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-neutral-800">
              <div>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">{subscription.planName || 'Free Tier'}</h3>
                <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1">
                  {isPro 
                    ? `Unlimited sheet scans & measurement rows. Expiration: ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Active'}` 
                    : 'Restricted features. Upgrade to Tivera Pro or redeem your 7-Day activation key below.'}
                </p>
              </div>

              {!isPro ? (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-[#0a0a0a] hover:bg-neutral-200 text-xs font-black tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-all cursor-pointer whitespace-nowrap border border-white flex items-center justify-center space-x-2 active:scale-98"
                >
                  <CreditCard size={14} />
                  <span>UPGRADE TO PRO</span>
                </button>
              ) : isRazorpaySubscription ? (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>RAZORPAY VERIFIED PLAN</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDowngrade}
                  disabled={isDowngrading}
                  className="w-full sm:w-auto px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center disabled:opacity-50 active:scale-98"
                >
                  {isDowngrading ? 'DOWNGRADING...' : 'DOWNGRADE TO FREE'}
                </button>
              )}
            </div>
          </div>

          {/* UNIQUE 7-DAY ACTIVATION KEY CARD - ONLY VISIBLE IF UNUSED */}
          {!userKeyRecord?.isUsed && (
            <div className="p-4 sm:p-6 bg-[#e8e6e1] border border-[#d4d1ca] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Key size={16} className="text-[#0a0a0a] flex-shrink-0" />
                  <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                    YOUR UNIQUE 7-DAY PRO ACTIVATION KEY
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest">
                  UNUSED (READY)
                </span>
              </div>

              <div className="bg-white border border-[#d4d1ca] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="w-full sm:w-auto">
                  <span className="text-[9px] sm:text-[10px] font-black text-[#6b6863] uppercase tracking-widest block">Assigned Single-Use Code</span>
                  <span className="text-sm sm:text-lg font-black text-[#0a0a0a] tracking-[0.15em] sm:tracking-[0.25em] select-all break-all block mt-0.5">
                    {userKeyRecord?.key || 'TIVERA-7D-MEET-0656'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="w-full sm:w-auto px-3.5 py-2 bg-[#0a0a0a] hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer active:scale-95 border border-black"
                >
                  {copiedKey ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>
          )}

          {/* REDEEM CODE INPUT FORM - ALWAYS VISIBLE FOR PROMO & ACTIVATION KEYS */}
          <div className="p-4 sm:p-6 bg-[#e8e6e1] border border-[#d4d1ca] space-y-3">
            <div className="flex items-center space-x-2">
              <Key size={16} className="text-[#0a0a0a] flex-shrink-0" />
              <h3 className="text-xs font-black text-[#0a0a0a] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                REDEEM PROMO OR ACTIVATION CODE
              </h3>
            </div>

            <label className="block text-[10px] font-black text-[#6b6863] uppercase tracking-widest">
              Enter your trial key or special promo code below:
            </label>

            {keyRedeemMsg && (
              <div className="p-3 bg-[#0a0a0a] text-white text-xs font-black uppercase tracking-wider flex items-center space-x-2 border border-black">
                <Check size={16} className="text-emerald-400" />
                <span>{keyRedeemMsg}</span>
              </div>
            )}

            {keyRedeemError && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold uppercase tracking-wider flex items-start space-x-2">
                <AlertTriangle size={16} className="text-rose-700 mt-0.5 flex-shrink-0" />
                <span>{keyRedeemError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="ENTER CODE (E.G. TIVERA-7D-XXXX-YYYY)"
                className="flex-1 px-3 py-2.5 border border-[#d4d1ca] focus:border-[#0a0a0a] text-xs font-bold text-[#0a0a0a] bg-white outline-none uppercase tracking-widest"
              />
              <button
                type="button"
                onClick={handleRedeemKey}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0a0a0a] hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] transition-all cursor-pointer border border-black whitespace-nowrap text-center active:scale-98"
              >
                REDEEM CODE
              </button>
            </div>
          </div>

          <div className="bg-[#e8e6e1] border border-[#d4d1ca] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0a0a0a] text-white flex items-center justify-center font-black uppercase text-sm sm:text-base border border-black flex-shrink-0">
                {user?.email?.slice(0, 2) || 'TV'}
              </div>
              <div className="overflow-hidden">
                <span className="block text-[9px] sm:text-[10px] font-black text-[#6b6863] uppercase tracking-widest">LOGGED IN ACCOUNT</span>
                <span className="font-black text-[#0a0a0a] text-xs sm:text-sm uppercase truncate block">{user?.email || 'TIVERA User'}</span>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white self-start sm:self-auto">
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
            
            <div className="bg-[#e8e6e1] border border-[#d4d1ca] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Cloud size={16} className="text-[#0a0a0a] flex-shrink-0" />
                  <span className="font-black text-xs text-[#0a0a0a] uppercase tracking-wider">
                    NETWORK: {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-wider">
                  Saved estimates: <strong className="text-[#0a0a0a]">{jobs.length} total</strong> ({jobs.filter(j => j.syncStatus === 'pending_sync').length} pending)
                </p>
              </div>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#0a0a0a] hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase px-4 py-2.5 disabled:opacity-40 transition-all cursor-pointer border border-black active:scale-98"
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
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black px-8 py-3.5 text-xs tracking-[0.18em] sm:tracking-[0.2em] disabled:opacity-50 transition-all cursor-pointer border border-black uppercase active:scale-98 shadow-xs"
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
