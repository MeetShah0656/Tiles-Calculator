/**
 * Tiny in-memory TTL cache for API route handlers.
 *
 * Scoped to a single warm serverless instance's memory — on Vercel a given
 * user's requests can land on different instances, so a `set`/`invalidate`
 * here is a best-effort latency optimization only, never a correctness
 * guarantee. Keep TTLs short; callers must be correct even if every read
 * were a cache miss.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateCached(key: string): void {
  store.delete(key);
}
