# BESTOLD — cPanel Deployment Guide

## ⚠️ IMPORTANT: What Stays on Supabase (Cloud)

**You CANNOT move the following to cPanel.** They must remain on Supabase:

| Component | Location | Action Required |
|-----------|----------|-----------------|
| PostgreSQL Database | Supabase Cloud | Keep as-is |
| Authentication (Auth) | Supabase Cloud | Keep as-is |
| Storage Buckets | Supabase Cloud | Keep as-is |
| Edge Functions (push notifications, etc.) | Supabase Cloud | Keep as-is |
| Realtime (chat, live updates) | Supabase Cloud | Keep as-is |

**What you ARE deploying to cPanel:** Only the **frontend static files** (HTML, JS, CSS, images, fonts).

---

## 📁 Files You Need (Download from This Folder)

| File | Where to Put | Purpose |
|------|-------------|---------|
| `.htaccess` | `public_html/` | SPA routing, caching, compression, security headers |

---

## 🔧 Step-by-Step Deployment

### Step 1 — Prepare Your Local Machine

1. **Install Node.js** (v18 or higher): https://nodejs.org/
2. **Install pnpm** (or use npm):
   ```bash
   npm install -g pnpm
   ```

### Step 2 — Set Production Environment Variables

In your local project root, create a `.env.production` file with your **real** Supabase credentials:

```bash
# Supabase Project (your actual Supabase URL)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PWA Push Notifications (VAPID public key from your Supabase secrets)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here

# App identifier
VITE_APP_ID=app-ahn8efyun8ch
```

> **Where to find these values:**
> - Supabase URL & Anon Key: Supabase Dashboard → Settings → API
> - VAPID Public Key: Supabase Dashboard → Edge Functions Secrets (or your `.env` history)

### Step 3 — Build the Project

Open your terminal in the project folder and run:

```bash
# Install dependencies
pnpm install

# Build for production (creates dist/ folder)
pnpm run build
```

If the build succeeds, a `dist/` folder will appear containing all static files.

### Step 4 — Upload to cPanel

#### Option A — cPanel File Manager (Easiest)
1. Log in to cPanel
2. Open **File Manager**
3. Navigate to `public_html/` (or your subdomain folder, e.g., `public_html/bestold/`)
4. **Delete old files first** (if updating)
5. Upload **all contents of the `dist/` folder** (NOT the `dist` folder itself — its contents go into `public_html/`)

#### Option B — FTP (FileZilla / WinSCP)
1. Connect to your hosting via FTP
2. Navigate to `public_html/`
3. Upload **all contents** of the `dist/` folder

### Step 5 — Upload the .htaccess File

1. In the same `public_html/` folder
2. Upload the `.htaccess` file provided in this folder
3. If a `.htaccess` already exists, **replace it** (back up the old one first)

### Step 6 — Verify File Structure

Your `public_html/` should look like this:

```
public_html/
├── .htaccess          ← Uploaded from this guide
├── index.html         ← Main entry (from dist/)
├── manifest.json      ← PWA manifest (from dist/)
├── service-worker.js  ← PWA service worker (from dist/)
├── assets/            ← JS & CSS bundles (from dist/)
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── ... (other static files from dist/)
```

---

## 🔗 Step 7 — Configure Your Domain & Supabase

### A) Point Domain to cPanel

In your **domain registrar** (e.g., GoDaddy, Namecheap, Cloudflare):
- Set the **A record** for `bestold.in` → your **cPanel server IP**
- Or update nameservers to your hosting provider's nameservers

### B) Configure Supabase CORS (CRITICAL)

Your app makes API calls to Supabase from your cPanel domain. You MUST add your domain to Supabase's allowed origins:

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** → **URL Configuration**
3. Add your production URL:
   - Site URL: `https://bestold.in` (or your exact domain)
   - Redirect URLs: Add `https://bestold.in/*` and `https://www.bestold.in/*`
4. Save

### C) Update Supabase Storage CORS

1. Go to **Supabase Dashboard** → **Storage**
2. Click the **Policies** or **CORS** settings
3. Add `https://bestold.in` to the allowed origins

---

## ✅ Post-Deployment Checklist

After uploading, open `https://bestold.in` and test:

- [ ] Homepage loads correctly
- [ ] Login / Signup works
- [ ] Navigation works (e.g., click "Store", "Chat", "Sell" — no 404 errors)
- [ ] Product images load from Supabase Storage
- [ ] Chat messages send/receive
- [ ] Stripe payments work (test with Stripe test card)
- [ ] "Install App" banner appears (PWA)
- [ ] Push notifications subscribe/unsubscribe works

---

## 🛠️ Troubleshooting

### Blank Page After Upload
- Check browser console (F12 → Console) for JS errors
- Verify all `assets/` files uploaded correctly
- Ensure `.htaccess` is uploaded and mod_rewrite is enabled by your host

### 404 on Page Refresh (e.g., /store/123)
- `.htaccess` is missing or not being read
- Contact your hosting provider to confirm **mod_rewrite** is enabled

### "Network Error" or API Calls Failing
- Check `.env.production` — Supabase URL must be correct
- Verify Supabase CORS settings include your domain
- Check browser console for CORS errors

### Images Not Loading
- Supabase Storage CORS not configured for your domain
- Check Storage → Policies → CORS in Supabase Dashboard

### PWA "Install" Not Working
- Must serve over **HTTPS** (cPanel SSL required)
- `manifest.json` and `service-worker.js` must be at root level
- Check DevTools → Application → Manifest for errors

### Push Notifications Not Working
- Must be HTTPS
- Service worker must be served with `Content-Type: application/javascript`
- VAPID public key in `.env.production` must match Supabase secrets

---

## 📊 Hosting Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Storage | 50 MB | 100 MB |
| Bandwidth | 1 GB/month | 5 GB/month |
| PHP | Not required | Not required |
| SSL (HTTPS) | **Required** for PWA & push notifications | Let's Encrypt free SSL |
| Node.js | Not required on server | Build runs locally only |

---

## 🔄 How to Update (After Changes)

Every time you make code changes:

```bash
# 1. Build locally
pnpm run build

# 2. Delete old files in cPanel public_html/ (keep .htaccess!)
# 3. Re-upload all contents of dist/
```

---

## 📦 What's Inside `dist/` (After Build)

| File/Folder | Size | Purpose |
|-------------|------|---------|
| `index.html` | ~5 KB | Entry HTML file |
| `manifest.json` | ~1 KB | PWA manifest |
| `service-worker.js` | ~5 KB | PWA service worker |
| `assets/` | ~2–5 MB | JS bundles, CSS, images, fonts (hashed for caching) |
| `.htaccess` | ~3 KB | Apache config (you provide this separately) |

**Total size:** ~3–6 MB (varies with features)

---

## 💡 Pro Tips

1. **Always use HTTPS** — PWA install, push notifications, and Stripe require it
2. **Keep `.htaccess`** when re-uploading — don't overwrite it during updates
3. **Test on mobile** — PWA features only work on mobile browsers
4. **Back up your Supabase project** before making major changes
5. **Use Cloudflare** (free) in front of cPanel for CDN caching, SSL, and DDoS protection

---

## 🆘 Need Help?

| Issue | Where to Get Help |
|-------|------------------|
| Build errors | Run `pnpm run build` locally and read the error message |
| Upload issues | Contact your hosting provider's support |
| Supabase/API errors | Supabase Dashboard → Logs, or Supabase Discord |
| CORS errors | Supabase Dashboard → Auth → URL Configuration |
| Domain/DNS issues | Your domain registrar's support |
