# TIVERA — Natural Stone & Tiles Estimator

Next.js app for measuring, quoting, and invoicing natural stone/tile jobs, with an optional Python (FastAPI) backend for scanning paper measurement notes via Gemini Vision.

## Stack

- **Frontend**: Next.js (App Router), React, Zustand, Tailwind CSS — deployed on **Vercel**
- **Database/Auth**: Supabase (Postgres, Auth, Storage) — **Supabase**
- **Payments**: Razorpay
- **OCR backend**: FastAPI + Google Gemini Vision (`backend/`) — deployed on **Render**

### Deployment architecture

```
Browser → Vercel (Next.js: pages + /api routes) → Supabase (DB/Auth)
                    ↓ (scan-measurements route)
             Render (FastAPI backend) → Gemini Vision API
```

The `backend/` FastAPI service has no `render.yaml`/`Procfile` in this repo —
it's configured directly in Render's dashboard (root directory `backend`,
build `pip install -r requirements.txt`, start
`uvicorn main:app --host 0.0.0.0 --port $PORT`) and auto-deploys on push to
`main`, the same way Vercel does for the frontend.

`app/api/scan-measurements/route.ts` calls the Render backend first via
`NEXT_PUBLIC_PYTHON_BACKEND_URL`. If that's unreachable (unset, backend down,
etc.) it silently falls back to calling the Gemini REST API directly from the
Next.js route itself using `GEMINI_API_KEY` — so scanning keeps working even
if Render is down, just without going through the Python service.

## Prerequisites

- Node.js 18+
- Python 3.10+ (only needed if you run the optional FastAPI backend locally)
- A Supabase project
- A Razorpay account (test keys are fine for local dev)

## 1. Install dependencies

```bash
npm install
```

Optional — only if you want the local Python scanning backend instead of the built-in Next.js/Gemini REST fallback:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | From Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for payments/activation) | Server-only. Never prefix with `NEXT_PUBLIC_`. Required for `verify-payment`, the Razorpay webhook, and activation-key redemption to actually write to the database |
| `GEMINI_API_KEY` | Optional | Enables real paper-note scanning; without it the scan endpoints return mock data |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional | Without these, checkout runs in demo/mock mode (no real charge) |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Required for the webhook route to accept and process events at all |
| `NEXT_PUBLIC_PYTHON_BACKEND_URL` | Yes in production | Set on Vercel to your Render backend's URL. Defaults to `http://localhost:8000`, which only works for local dev |
| `ACTIVATION_MASTER_KEYS` | Optional | Comma-separated override for the support/master activation keys (see `app/api/activation/redeem/route.ts`) |
| `ALLOWED_ORIGINS` | Yes in production | Set on the **Render** service (not Vercel) — comma-separated list of origins allowed to call the FastAPI backend, e.g. `https://tivera.vercel.app`. See `backend/main.py` |

`.env.local` is gitignored and never committed.

## 3. Set up the database

In the Supabase SQL editor (or via the CLI), run:

```bash
supabase/schema.sql
```

This creates the tables (`profiles`, `jobs`, `measurement_rows`, `subscriptions`, `payment_events`), enables Row Level Security, and sets up the new-user trigger. Re-run this file any time it changes — it isn't applied automatically by deploying the app.

## 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional — run the Python scanning backend alongside it (separate terminal, from `backend/` with the venv activated):

```bash
uvicorn main:app --reload --port 8000
```

If it's not running, paper-note scanning automatically falls back to a direct Gemini REST call from the Next.js API route (needs `GEMINI_API_KEY`), or mock data if that's also unset.

## Production deploy

Before deploying, see [`DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md) — it covers the manual steps (applying the schema to your live Supabase project, setting the service role key and Razorpay secrets in your host's environment variables, etc.) that a `git push` alone will not do for you.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npx tsc --noEmit` | Type-check without emitting output |
