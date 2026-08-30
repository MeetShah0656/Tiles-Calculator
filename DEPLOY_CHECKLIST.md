# Post-Fix Deploy Checklist

Code-side security fixes are done. These steps must be done manually against the live Supabase/Vercel/Render projects — nothing here happens automatically from a git push, and none of it is deployed yet as of this checklist.

Architecture: **Vercel** (Next.js frontend + `/api` routes) → **Supabase** (DB/Auth) and → **Render** (FastAPI OCR backend, `backend/`). See the README's "Deployment architecture" section.

## Supabase

- [ ] **Re-run `supabase/schema.sql`** against the live Supabase project (SQL editor or CLI). This applies the tightened RLS policies, new indexes, and the `payment_events` audit table. Nothing else on this list works until this is done.
- [ ] **Audit existing `subscriptions` rows** for any Pro/active status granted for free via the old open RLS policies or the client-side auth/payment bypasses, if this app has been live in production.
- [ ] **Add the production OAuth callback URL** to Authentication → URL Configuration → Redirect URLs: `https://tivera.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local dev). New requirement from the cookie-session refactor — Google sign-in now redirects through a dedicated `app/auth/callback` route instead of straight back to the app root, and Supabase rejects redirects to URLs not on this list.

## Vercel (frontend)

- [ ] **Add `SUPABASE_SERVICE_ROLE_KEY`** in Vercel's Environment Variables (dashboard — never in `vercel.json`, which is committed to git). Without it, `verify-payment`, `webhook`, and `activation/redeem` log a warning and silently skip the DB write.
- [ ] **Confirm `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`** are set in Vercel. Both are now required for real payment verification (not just demo mode).
- [ ] **Rotate the master activation keys** via `ACTIVATION_MASTER_KEYS` env var (comma-separated) — the defaults (`TIVERA-UNLIMITED-PRO`, etc.) were exposed during this review's transcript.
- [ ] **Confirm `NEXT_PUBLIC_PYTHON_BACKEND_URL`** is set to the live Render backend's URL — without it, scanning silently falls back to the direct Gemini call from the Next.js route on every request instead of using Render.

## Render (backend)

- [ ] **Confirm auto-deploy is enabled** for the `backend/` service so the CORS fix in `backend/main.py` actually goes out — this repo has no `render.yaml`, so the service's build/start commands and deploy trigger only exist in Render's dashboard config.
- [ ] **Set `ALLOWED_ORIGINS`** on the Render service (not Vercel) to your production frontend origin, e.g. `https://tivera.vercel.app`. Without it, the CORS fix falls back to `http://localhost:3000` only and the frontend won't be able to call the backend at all.
