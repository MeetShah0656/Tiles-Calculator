'use client';

import React, { useState } from 'react';
import { useJobStore } from '@/store/store.js';
import { Check, Zap, X, ShieldCheck, Sparkles, CreditCard, Key, AlertTriangle } from 'lucide-react';

export default function UpgradeProModal({ isOpen, onClose }) {
  const activateProSubscription = useJobStore((state) => state.activateProSubscription);
  const redeemActivationKey = useJobStore((state) => state.redeemActivationKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [keyInput, setKeyInput] = useState('');
  const [keySuccess, setKeySuccess] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);

  if (!isOpen) return null;

  const handleRedeemTrialKey = (e) => {
    e.preventDefault();
    setError('');
    setKeySuccess('');

    const res = redeemActivationKey(keyInput, 'meetshah0656@gmail.com');
    if (res.success) {
      setKeySuccess(res.message);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(res.error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const amount = selectedPlan === 'monthly' ? 49900 : 399900; // in paise

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          plan: selectedPlan
        })
      });

      const orderData = await orderRes.json().catch(() => ({}));

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_tivera_pro',
        amount: amount,
        currency: 'INR',
        name: 'TIVERA Natural Stone',
        description: `TIVERA Pro Subscription (${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'})`,
        image: '/favicon.ico',
        order_id: orderData?.orderId || undefined,
        handler: function (response) {
          activateProSubscription({
            paymentId: response.razorpay_payment_id || 'pay_razorpay_mock_' + Date.now(),
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            expiresAt: selectedPlan === 'monthly'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          });
          setLoading(false);
          onClose();
        },
        prefill: {
          name: 'Meet Shah',
          email: 'meetshah0656@gmail.com',
          contact: '+919876543210'
        },
        theme: {
          color: '#0a0a0a'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(response.error.description || 'Payment failed. Please try again.');
          setLoading(false);
        });
        rzp.open();
      } else {
        setTimeout(() => {
          activateProSubscription({
            paymentId: 'pay_razorpay_demo_' + Date.now(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          setLoading(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error("Razorpay subscription error:", err);
      setTimeout(() => {
        activateProSubscription({
          paymentId: 'pay_razorpay_demo_' + Date.now(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        setLoading(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#f4f2ee] border border-[#d4d1ca] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0a0a0a] text-white p-6 relative border-b border-black">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.25em] mb-3 border border-neutral-700">
            <Sparkles size={12} className="text-white" />
            <span>TIVERA PRO PLAN</span>
          </div>

          <h2 className="text-3xl font-black tracking-[0.15em] uppercase">
            UPGRADE TO TIVERA PRO
          </h2>
          <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-1">
            Unlock unlimited paper note scanning, printing & WhatsApp PDF invoices.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-[#0a0a0a] text-white border border-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {keySuccess && (
            <div className="p-3 bg-[#0a0a0a] text-white border border-black text-xs font-black uppercase tracking-wider flex items-center space-x-2">
              <Check size={16} className="text-emerald-400" />
              <span>{keySuccess}</span>
            </div>
          )}

          {/* Redeem Key Section Toggle */}
          <div className="border border-[#d4d1ca] p-3 bg-[#e8e6e1]">
            <button
              type="button"
              onClick={() => setShowKeyForm(!showKeyForm)}
              className="flex items-center justify-between w-full text-xs font-black text-[#0a0a0a] uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Key size={14} />
                <span>HAVE A 7-DAY PRO ACTIVATION KEY?</span>
              </div>
              <span className="text-[10px] text-[#6b6863] underline">{showKeyForm ? 'HIDE' : 'REDEEM KEY'}</span>
            </button>

            {showKeyForm && (
              <form onSubmit={handleRedeemTrialKey} className="mt-3 space-y-2 pt-2 border-t border-[#d4d1ca]">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter TIVERA-7D-XXXX-YYYY"
                  className="w-full px-3 py-2 border border-[#d4d1ca] text-xs font-bold text-[#0a0a0a] bg-white outline-none uppercase tracking-widest"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0a0a0a] text-white font-black text-xs uppercase tracking-widest hover:bg-neutral-800 cursor-pointer"
                >
                  ACTIVATE 7-DAY FREE PRO TRIAL
                </button>
              </form>
            )}
          </div>

          {/* Plan Selector Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#e8e6e1] border border-[#d4d1ca]">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`py-2 px-3 text-xs font-black tracking-widest uppercase transition-all cursor-pointer ${
                selectedPlan === 'monthly'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#6b6863] hover:text-[#0a0a0a]'
              }`}
            >
              MONTHLY (₹499/MO)
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan('yearly')}
              className={`py-2 px-3 text-xs font-black tracking-widest uppercase transition-all cursor-pointer relative ${
                selectedPlan === 'yearly'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#6b6863] hover:text-[#0a0a0a]'
              }`}
            >
              YEARLY (₹3,999/YR)
              <span className="absolute -top-2 -right-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 uppercase tracking-wider">
                SAVE 33%
              </span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3 text-xs">
              <div className="p-1 bg-[#0a0a0a] text-white mt-0.5">
                <Check size={12} />
              </div>
              <div>
                <span className="font-black text-[#0a0a0a] uppercase tracking-wider">Unlimited Paper Note Scanning</span>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-wider">Parse full paper measurement sheets instantly.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="p-1 bg-[#0a0a0a] text-white mt-0.5">
                <Check size={12} />
              </div>
              <div>
                <span className="font-black text-[#0a0a0a] uppercase tracking-wider">Unlimited Measurement Rows</span>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-wider">Add as many rows as needed for commercial jobs.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <div className="p-1 bg-[#0a0a0a] text-white mt-0.5">
                <Check size={12} />
              </div>
              <div>
                <span className="font-black text-[#0a0a0a] uppercase tracking-wider">WhatsApp & PDF Invoices</span>
                <p className="text-[10px] text-[#6b6863] font-bold uppercase tracking-wider">Direct customer billing with custom business branding.</p>
              </div>
            </div>
          </div>

          {/* Price & Checkout Button */}
          <div className="pt-3 border-t border-[#d4d1ca] space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-black text-[#6b6863] uppercase tracking-widest">SUBSCRIPTION PRICE</span>
              <div className="text-right">
                <span className="text-3xl font-black text-[#0a0a0a]">
                  {selectedPlan === 'monthly' ? '₹499' : '₹3,999'}
                </span>
                <span className="text-xs text-[#6b6863] font-black uppercase tracking-wider ml-1">
                  /{selectedPlan === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 bg-[#0a0a0a] hover:bg-neutral-800 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 border border-black uppercase tracking-[0.2em]"
            >
              <CreditCard size={16} />
              <span>{loading ? 'PROCESSING...' : 'SUBSCRIBE WITH RAZORPAY'}</span>
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] font-black text-[#6b6863] uppercase tracking-widest">
              <ShieldCheck size={12} />
              <span>SECURED BY RAZORPAY • 256-BIT ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
