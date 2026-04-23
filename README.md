# ComponentWatch Dashboard

The React front end for [ComponentWatch](https://componentwatch.com).
Deployed to `app.componentwatch.com`.

Built with Vite + React 18 + TypeScript + Tailwind + Clerk + React Router.

---

## Current state (Phase 1A — session 5, 2026-04-21)

What works:
- Sign-in flow via Clerk (email/password, Google, GitHub — configure providers in Clerk Dashboard)
- Protected routes with auth gate
- Top navigation: ComponentWatch wordmark + Engineering/PC Builds switcher + UserButton
- Empty-state dashboards for both Engineering and PC Builds sides
- API client wrapper (`src/lib/api.ts`) ready to make authed requests to the FastAPI backend

What's NOT wired yet:
- **Backend does not yet verify Clerk JWTs** (Phase 1B). Calls will reach the backend but won't be authenticated.
- **No live data yet** — both dashboards show empty-state cards only (Phase 2).
- **Not deployed to `app.componentwatch.com`** — the Cloudflare Pages project still needs to be created (see Deployment below).

---

## Prerequisites

1. **Node.js v20 LTS or newer.** Check with `node --version`. Install from https://nodejs.org/ if missing.
2. **A Clerk account.** Sign up at https://clerk.com/ and create an application named "ComponentWatch" (or whatever you prefer).
3. **In Clerk Dashboard → User & Authentication → Email, Phone, Username:** enable "Email address" and "Password".
4. **In Clerk Dashboard → User & Authentication → Social Connections:** enable Google and GitHub.
5. **FastAPI backend running locally.** `python api_server.py` on port 8000. This repo's dev proxy assumes that's available.

---

## First-time setup

```powershell
# From C:\AppDev\componentwatch-dashboard
npm install

# Copy the env template and fill in the Clerk publishable key.
# Get it from: https://dashboard.clerk.com > your app > API Keys > "Publishable key"
# (starts with pk_test_ for dev, pk_live_ for prod)
copy .env.example .env.local
notepad .env.local    # paste your publishable key
```

---

## Running the dev server

```powershell
npm run dev
# Opens http://localhost:5173
```

You should see the sign-in page. After signing up/in, you'll land on the PC Builds empty state.

The Vite dev server proxies `/api/*` requests to `http://localhost:8000` (the FastAPI backend) so CORS is a non-issue during local dev. Change `VITE_API_BASE_URL` in `.env.local` if your backend runs elsewhere.

---

## Build + preview

```powershell
npm run build        # Outputs to dist/
npm run preview      # Serves dist/ locally, mimics production behavior
npm run lint         # Type-checks the whole app without emitting
```

---

## Deployment to `app.componentwatch.com`

You chose GitHub-connected auto-deploy, so the flow is:

### One-time Cloudflare Pages setup

1. Push this directory to a new GitHub repo named `componentwatch-dashboard`.
2. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select the `componentwatch-dashboard` repo.
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (leave blank)
5. **Environment variables (Production):**
   - `VITE_CLERK_PUBLISHABLE_KEY` — your Clerk publishable key (same value as `.env.local`, or a `pk_live_...` if you promote Clerk to production)
   - `VITE_API_BASE_URL` — `https://api.componentwatch.com`
6. Click "Save and Deploy".
7. Once the first build succeeds, go to the Pages project → Custom domains → add `app.componentwatch.com`. Cloudflare will auto-create the DNS CNAME since your nameservers are already on Cloudflare.

### After first-time setup

Every `git push` to `main` triggers a production deploy. Pull requests get preview deploys at `<hash>.componentwatch-dashboard.pages.dev`.

---

## Project structure

```
componentwatch-dashboard/
├── package.json               # Dependencies + scripts
├── vite.config.ts             # Dev server config, /api proxy to :8000
├── tsconfig.json              # TS project references
├── tsconfig.app.json          # TS config for src/
├── tsconfig.node.json         # TS config for vite.config.ts
├── tailwind.config.js         # Apple-inspired theme tokens
├── postcss.config.js          # Tailwind via PostCSS
├── wrangler.jsonc             # Cloudflare Pages SPA routing
├── index.html                 # Vite HTML entry
├── .env.example               # Template (committed)
├── .env.local                 # Real values (gitignored)
└── src/
    ├── main.tsx               # ClerkProvider + BrowserRouter wrapping
    ├── App.tsx                # Route table + auth gate
    ├── index.css              # Tailwind directives + base styles
    ├── lib/
    │   └── api.ts             # Authed fetch wrapper
    ├── components/
    │   ├── Header.tsx         # Top bar
    │   ├── AppSwitcher.tsx    # Engineering ↔ PC Builds tabs
    │   └── ProtectedLayout.tsx  # Header + <Outlet/> for protected routes
    └── pages/
        ├── SignInPage.tsx     # Clerk SignIn host
        ├── PCBuildsPage.tsx   # Default landing after sign-in
        └── EngineeringPage.tsx
```

---

## Roadmap

### Phase 1B (next session)

Backend auth integration:
- Add Clerk JWT verification middleware to FastAPI (`api_server.py`)
- Add CORS middleware for `app.componentwatch.com` origin
- Add a Clerk webhook endpoint that upserts users into the `users` table (so Clerk user IDs map to internal user rows)

### Phase 2

First real screen with live data. Likely the PC Builds dashboard showing tracked items from `/api/components` with price history sparklines.

### Phase 3+

- BOM upload UI (Engineering)
- PCPartPicker paste-box import
- Watchlist table with live prices and "Buy" buttons
- Alert rule configuration
- Public build sharing pages

See `HANDOFF_*.md` in the backend repo for full context.
