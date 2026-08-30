'use client';

import { Cubit } from './Cubit';
import { useJobStore } from '@/store/store.js';
import { getSubscription } from '@/lib/usecases/subscription/getSubscription';
import { cancelSubscription as cancelSubscriptionUseCase } from '@/lib/usecases/subscription/cancelSubscription';
import { redeemActivationKey as redeemActivationKeyUseCase } from '@/lib/usecases/subscription/redeemActivationKey';

const FREE_SUBSCRIPTION = {
  isPro: false,
  planName: 'Free Tier',
  expiresAt: null,
  paymentId: null,
  paymentProvider: 'manual',
  activatedAt: null,
  activationKey: null,
  keyRedeemed: false
};

class SubscriptionCubitImpl extends Cubit {
  constructor() {
    super({ subscription: FREE_SUBSCRIPTION, status: 'idle', error: null });
  }

  // One-way mirror into the Zustand store, so Navbar/Dashboard/ActiveJobCalculator
  // (out of scope for this refactor) keep working unchanged, and get an
  // instant offline-first "Pro" badge from Zustand's persisted localStorage
  // value before this cubit's async init() resolves. SubscriptionCubit is the
  // only writer into this slice now — nothing reads it and writes back to Supabase.
  _mirrorToStore(subscription) {
    useJobStore.setState({ subscription });
  }

  async init() {
    return this.refresh();
  }

  async refresh() {
    this.setState({ status: 'loading', error: null });
    const result = await getSubscription();
    if (result.ok) {
      this.setState({ subscription: result.subscription, status: 'ready' });
      this._mirrorToStore(result.subscription);
    } else {
      this.setState({ subscription: FREE_SUBSCRIPTION, status: 'error', error: result.error });
      this._mirrorToStore(FREE_SUBSCRIPTION);
    }
    return result;
  }

  async cancel() {
    const result = await cancelSubscriptionUseCase();
    if (result.ok) {
      await this.refresh();
    }
    return result;
  }

  async redeemKey(key) {
    const result = await redeemActivationKeyUseCase(key);
    if (result.ok) {
      await this.refresh();
    }
    return result;
  }
}

export const subscriptionCubit = new SubscriptionCubitImpl();
