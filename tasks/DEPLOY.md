# Deployment Guide — BESTOLD

You can deploy BESTOLD to any static host. This project is pre-configured for **Vercel** and **Netlify**.

---

## Quick Deploy — Vercel (recommended)

1. **Export the project** from the Medo platform as a ZIP, or push to your own GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo (or drag-and-drop the ZIP).
3. In **Build & Output Settings**:
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Framework Preset: `Vite`
4. Click **Deploy**.

### Add your custom domain
5. Go to **Project Settings → Domains**.
6. Add `bestold.in` and `www.bestold.in`.
7. Set `bestold.in` as **Primary** — Vercel will automatically redirect `www` → non-www with a 301.

---

## Quick Deploy — Netlify

1. **Export the project** or push to GitHub.
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
3. Build settings (auto-detected from `netlify.toml`):
   - Build Command: `npm run build:prod`
   - Publish Directory: `dist`
4. Click **Deploy site**.

### Add your custom domain
5. Go to **Domain settings → Add custom domain**.
6. Add `bestold.in` and `www.bestold.in`.
7. Set `bestold.in` as primary — Netlify will redirect `www` → non-www automatically.

---

## Important — Supabase

This app uses **Supabase** for the database and authentication. When you deploy to your own host:
- The Supabase project URL and anon key are already baked into the app code.
- No extra backend server is needed — Supabase handles everything.
- Make sure your **Supabase Auth settings** allow the new domain:
  - Go to Supabase Dashboard → Authentication → URL Configuration
  - Add `https://bestold.in` (and `http://localhost:5173` for local dev) to **Site URL** and **Redirect URLs**.

---

## Already Configured

| File | What it does |
|------|-------------|
| `vercel.json` | 301 redirects, SPA fallback, security headers, asset caching |
| `netlify.toml` | Same redirects + headers, works for Netlify deploys |
| `public/robots.txt` | SEO crawler rules + sitemap location |
| `index.html` | Meta tags, canonical URL, Open Graph, Structured Data |

---

## Changing Features Later

Yes — the code is yours. You can:
- Edit any React component in `src/`
- Change colors, fonts, layout in `src/index.css`
- Add new pages in `src/pages/`
- Modify database rules in your Supabase dashboard
- Add new API functions in `src/db/api.ts`

Everything is standard React + TypeScript. No vendor lock-in.
