'use client';

import { useSyncExternalStore } from 'react';

/**
 * Minimal Cubit-shaped state container: holds `state`, notifies subscribers
 * on change. Feature cubits (AuthCubit, SubscriptionCubit) extend this and
 * add methods that call use-cases, then setState() with the result.
 */
export class Cubit {
  constructor(initialState) {
    this._state = initialState;
    this._listeners = new Set();
  }

  get state() {
    return this._state;
  }

  setState(patch) {
    this._state = typeof patch === 'function' ? patch(this._state) : { ...this._state, ...patch };
    this._listeners.forEach((listener) => listener(this._state));
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

/** Subscribes a React component to a Cubit's state via useSyncExternalStore. */
export function useCubit(cubit) {
  return useSyncExternalStore(
    (onStoreChange) => cubit.subscribe(onStoreChange),
    () => cubit.state,
    () => cubit.state
  );
}
