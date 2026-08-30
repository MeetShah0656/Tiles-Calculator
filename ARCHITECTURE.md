# Database Access Architecture

Two different data-access patterns currently coexist in this app, depending on whether a feature has gone through the cubit/use-case refactor yet.

## 1. Auth + Subscriptions (layered — cubit → use-case → API route → Supabase)

```
Component
  │  useCubit(authCubit) / useCubit(subscriptionCubit)
  ▼
Cubit (lib/state/AuthCubit.js, lib/state/SubscriptionCubit.js)
  │  calls a use-case
  ▼
Use-case (lib/usecases/auth/*, lib/usecases/subscription/*)
  │  fetch('/api/...') — same-origin, cookies ride along automatically
  ▼
Next.js API route (app/api/auth/*, app/api/subscription/*,
                    app/api/activation/redeem, app/api/razorpay/*)
  │  resolves the caller and picks one of two Supabase clients
  ▼
Supabase (Postgres + Auth), behind Row Level Security
```

The API route is the only place any of this ever touches Supabase — no browser code in this slice calls Supabase directly, with one deliberate exception (see below).

### Which Supabase client each route uses

**Session-scoped client** — `lib/supabase/server.ts`'s `getSessionUser()`. Reads the caller from the httpOnly session cookie (`supabase.auth.getUser()`, never `getSession()`), then operates through a client bound to that cookie so RLS applies normally. Used wherever the user's own RLS permissions are sufficient:

| Route | What it does |
|---|---|
| `GET /api/auth/session` | Resolves the user from the cookie, merges/creates their `profiles` row |
| `POST /api/auth/signin` | `auth.signInWithPassword` |
| `POST /api/auth/signup` | `auth.signUp` |
| `POST /api/auth/signout` | `auth.signOut` |
| `POST /api/auth/profile` | Upserts own `profiles` row + `auth.updateUser` |
| `GET /api/subscription` | Reads own `subscriptions` row (30s in-memory cache, see below) |
| `POST /api/subscription/cancel` | Self-downgrade write — the payload matches the RLS self-downgrade policy on `subscriptions` exactly (`status='canceled' AND plan_name='Free Tier' AND payment_provider='manual'`), so this is the one write a normal session is actually allowed to make |
| `GET /auth/callback` | Exchanges the OAuth `code` for a session (writes the session cookie) |

**Service-role admin client** — `lib/supabase/admin.ts`'s `getSupabaseAdmin()`. Bypasses RLS entirely. Used only *after* the route has independently verified something server-side, because RLS deliberately does not allow a normal user session to grant itself Pro:

| Route | Verifies, then writes |
|---|---|
| `POST /api/razorpay/verify-payment` | Razorpay HMAC signature (+ order lookup for the real plan) → upserts `subscriptions`, inserts `payment_events` |
| `POST /api/razorpay/webhook` | Razorpay webhook HMAC signature → updates `subscriptions`, inserts `payment_events` |
| `POST /api/activation/redeem` | Activation key match + single-use check → upserts `subscriptions` |

All three invalidate the subscription cache entry for that user after a successful write.

### Cache

`lib/cache/memoryCache.ts` — a `Map`-based TTL cache, `sub:${userId}` → computed subscription state, 30s TTL. Only used by `GET /api/subscription`. It's per-serverless-instance memory, not shared across instances — on Vercel a given user's requests can land on different warm instances, so this is a latency optimization only; correctness rests on the short TTL, not on the invalidation calls actually reaching the right instance.

### The one browser-side Supabase call in this slice

`lib/supabase/client.ts` (`createBrowserClient`) is used by exactly one use-case, `lib/usecases/auth/signInWithGoogle.js`, to kick off `auth.signInWithOAuth`. This has to happen in the browser because the PKCE `code_verifier` needs to land in a cookie that `app/auth/callback/route.ts` can then read back server-side. Nothing else should import this client.

### Zustand bridge (Navbar / Dashboard / ActiveJobCalculator)

`SubscriptionCubit` mirrors its state one-way into the existing Zustand store (`useJobStore.setState({ subscription })`) on every change. `components/Navbar.jsx`, `Dashboard.jsx`, and `ActiveJobCalculator.jsx` still read `state.subscription.isPro` from Zustand rather than the cubit directly — this was a deliberate scope boundary (see below) rather than an oversight. `SubscriptionCubit` is the only writer into that slice now; nothing reads it and writes back to Supabase.

## 2. Jobs / Measurements / Storage (original pattern — untouched, out of scope for this refactor)

```
Component / store.js
  │  creates an anon-key Supabase client on demand
  ▼
Supabase (Postgres), protected only by RLS
```

- `store/store.js`: `fetchJobsFromCloud()` and `syncPendingJobs()` call `jobs.select()`/`.upsert()` directly from the browser. `saveCurrentJobToHistory()` does the same but is dead code — no caller anywhere in the repo.
- `lib/storage/storageManager.ts` is already server-side (only ever called from `app/api/upload` and `app/api/scan-measurements`, both Route Handlers), but still authenticates to Supabase Storage with the anon key rather than the service-role client.
- No cubit, use-case, or dedicated API-route layer exists for any of this yet.

This is the natural next slice if the same layered pattern gets extended further — same shape as the auth/subscriptions work: a `JobsCubit` calling use-cases that hit new `/api/jobs/*` routes, instead of components/`store.js` reading and writing `jobs`/`measurement_rows` directly.

## Reference: files by role

| Role | Files |
|---|---|
| Cubits (state) | `lib/state/Cubit.js`, `lib/state/AuthCubit.js`, `lib/state/SubscriptionCubit.js` |
| Use-cases | `lib/usecases/auth/*.js`, `lib/usecases/subscription/*.js` |
| Supabase clients | `lib/supabase/server.ts` (session, RLS), `lib/supabase/admin.ts` (service role, bypasses RLS), `lib/supabase/client.ts` (browser, OAuth-only) |
| Session refresh | `middleware.ts`, `lib/supabase/middleware.ts` |
| Cache | `lib/cache/memoryCache.ts` |
| Auth/subscription API routes | `app/api/auth/*`, `app/auth/callback`, `app/api/subscription/*`, `app/api/activation/redeem`, `app/api/razorpay/*` |
| Untouched (jobs/storage) | `store/store.js` (jobs section), `lib/storage/storageManager.ts` |
| DB schema / RLS | `supabase/schema.sql` |
