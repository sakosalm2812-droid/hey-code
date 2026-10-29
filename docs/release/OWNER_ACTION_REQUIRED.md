# OWNER ACTION REQUIRED — HEY v0.0.0

**Date:** 2026-09-20  
**Status:** All code gates pass. External provisioning required for live launch.

---

## Required Before Launch (Code-Complete)

### 1. Supabase Project Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Deploy Edge Functions: `supabase/functions/hey`, `hey-push`, `hey-studio`, `admin-entitlements`, `delete-account`
  ```bash
  supabase functions deploy hey hey-push hey-studio admin-entitlements delete-account
  ```
- [ ] Run DB migrations (if schema exists): `supabase db push`
- [ ] Enable Realtime for tables used by chat/presence

### 2. Secrets (Server-Side — Supabase Dashboard → Edge Function Secrets)
| Secret | Source | Required |
|--------|--------|----------|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys | ✅ Yes |
| `GROQ_API_KEY` | https://console.groq.com/keys | ✅ Yes (free tier) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | ✅ Yes (free tier) |
| `BRAVE_API_KEY` | https://brave.com/search/api/ | ✅ Yes (free tier) |
| `VAPID_PRIVATE_KEY` | Generate: `npx web-push generate-vapid-keys` | ✅ Yes |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys | ⚠️ Optional (paid only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI `stripe listen --forward-to` | ⚠️ Optional |

### 3. Client-Side Config (`.env.local` — Gitignored)
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_HEY_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1
VITE_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
```

### 4. VAPID Keys
```bash
npx web-push generate-vapid-keys
# Add public to .env.local, private to Supabase secrets
```

### 5. Domain & TLS (Production)
- [ ] Configure custom domain in Supabase
- [ ] Update `VITE_HEY_API_URL` to production domain
- [ ] Ensure CORS headers allow your domain

---

## Platform-Specific (Post-Launch / Optional)

### iOS / macOS (Requires Apple Developer Program — $99/yr)
- [ ] Create App ID, Provisioning Profile
- [ ] Configure `src-tauri/tauri.conf.json` → `bundle.macOS` / `bundle.iOS`
- [ ] `npm run tauri:build` on macOS (Xcode 15+)
- [ ] TestFlight / App Store Connect upload

### Android (Requires Google Play Console — $25 one-time)
- [ ] `npm run tauri:android:init` → Configure `src-tauri/gen/android`
- [ ] `npm run tauri:android:build` → AAB
- [ ] Play Console upload

### Windows (Requires Code Signing Cert — ~$200-400/yr)
- [ ] Purchase EV cert (DigiCert, Sectigo, etc.)
- [ ] Configure `tauri.conf.json` → `bundle.windows` with cert thumbprint
- [ ] `npm run tauri:build` → MSIX/NSIS

---

## Verification Checklist (Run After Provisioning)

- [ ] `npm run dev` — SPA loads, no console errors
- [ ] `/login` → Supabase auth flow works
- [ ] `/chat` → Message sends, receives, persists
- [ ] `/agents` — 229 agents load, routing works
- [ ] `/voice` — MediaPipe gesture runtime initializes
- [ ] `/settings` — Push notification permission requests
- [ ] `supabase functions invoke hey --data '{"input":"test"}'` — Edge function responds
- [ ] `npm run tauri:dev` — Desktop window opens, IPC works

---

## Free-First Compliance
- ✅ No paid LLM required (Groq, Gemini, OpenRouter free tiers)
- ✅ Supabase free tier sufficient for launch scale
- ✅ VAPID/Web Push free
- ✅ Stripe only for optional paid subscriptions
- ✅ All adapters disabled by default, opt-in via settings

---

**Owner:** [Your Name]  
**Target Launch Date:** [Set after provisioning complete]