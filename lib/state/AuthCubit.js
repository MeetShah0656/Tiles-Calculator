'use client';

import { Cubit } from './Cubit';
import { signIn as signInUseCase } from '@/lib/usecases/auth/signIn';
import { signUp as signUpUseCase } from '@/lib/usecases/auth/signUp';
import { signOut as signOutUseCase } from '@/lib/usecases/auth/signOut';
import { getCurrentUser } from '@/lib/usecases/auth/getCurrentUser';
import { updateProfile as updateProfileUseCase } from '@/lib/usecases/auth/updateProfile';
import { signInWithGoogle as signInWithGoogleUseCase } from '@/lib/usecases/auth/signInWithGoogle';

class AuthCubitImpl extends Cubit {
  constructor() {
    super({ user: null, status: 'idle', error: null });
  }

  async init() {
    if (this.state.status === 'loading') return;
    this.setState({ status: 'loading', error: null });
    try {
      const user = await getCurrentUser();
      this.setState({ user, status: user ? 'authenticated' : 'unauthenticated' });
    } catch (err) {
      this.setState({ user: null, status: 'error', error: err.message || 'Failed to load session.' });
    }
  }

  async signIn(email, password) {
    this.setState({ status: 'loading', error: null });
    const result = await signInUseCase({ email, password });
    if (result.ok) {
      this.setState({ user: result.user, status: 'authenticated', error: null });
    } else {
      this.setState({ status: 'unauthenticated', error: result.error });
    }
    return result;
  }

  async signUp(email, password, businessName, phoneNumber) {
    this.setState({ status: 'loading', error: null });
    const result = await signUpUseCase({ email, password, businessName, phoneNumber });
    if (result.ok) {
      this.setState({ user: result.user, status: 'authenticated', error: null });
    } else {
      this.setState({ status: 'unauthenticated', error: result.error });
    }
    return result;
  }

  async signInWithGoogle() {
    this.setState({ status: 'loading', error: null });
    const result = await signInWithGoogleUseCase();
    // On success this navigates away to Google — no further local state change needed.
    if (!result.ok) {
      this.setState({ status: 'unauthenticated', error: result.error });
    }
    return result;
  }

  async signOut() {
    await signOutUseCase();
    this.setState({ user: null, status: 'unauthenticated', error: null });
  }

  async updateProfile(fields) {
    const result = await updateProfileUseCase(fields);
    if (result.ok) {
      this.setState({ user: result.user });
    }
    return result;
  }
}

export const authCubit = new AuthCubitImpl();
