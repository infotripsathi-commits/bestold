# BESTOLD Play Store Deployment Guide

## What I Have Already Done For You

The code changes below are complete and committed in your codebase:

1. **Service Worker fixed for SPA offline navigation** — Any route like `/seller/dashboard` now falls back to `index.html` when offline, so React Router renders the correct page inside the TWA app.
2. **`assetlinks.json` template created** at `public/.well-known/assetlinks.json` — You only need to replace the SHA-256 placeholder.
3. **Manifest + icons verified** — All required sizes (72→512) are present.
4. **PWA install prompt already exists** — Handled by `usePWA.ts` and `PWAInstallPrompt.tsx`.

---

## What YOU Must Do Yourself (Cannot Be Done From Medo)

These steps require your local computer, your Google account, and your credit card.

---

### Step 1: Install Bubblewrap CLI (on YOUR computer)

Bubblewrap is a command-line tool from Google. It runs on **your** machine (Windows/Mac/Linux), not on Medo.

```bash
npm install -g @bubblewrap/cli
```

If you don't have Node.js installed, download it first from [nodejs.org](https://nodejs.org).

---

### Step 2: Initialize Your Android Project

Run this on **your computer** (replace with your actual domain):

```bash
bubblewrap init --manifest=https://bestold.in/manifest.json
```

It will ask:
| Question | Recommended Answer |
|----------|-------------------|
| Application name | `BESTOLD` |
| Short name | `BESTOLD` |
| Package ID | `com.bestold.app` |
| Start URL | `/` |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Theme color | `#16a34a` |
| Background color | `#ffffff` |

It creates a folder like `bestold-app/` on your computer.

---

### Step 3: Get Your SHA-256 Fingerprint

After init, run:

```bash
cd bestold-app/
bubblewrap fingerprint
```

This prints something like:
```
81:EF:... (SHA-256)
SHA-256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

**Copy the SHA-256 string.**

---

### Step 4: Replace the Placeholder in assetlinks.json

1. Open this file in your website code:
   `public/.well-known/assetlinks.json`

2. Replace:
   ```json
   "sha256_cert_fingerprints": [
     "REPLACE_THIS_WITH_YOUR_SHA256_FINGERPRINT"
   ]
   ```
   with your **actual** SHA-256 string from Step 3.

3. Rebuild and redeploy your website so the file goes live at:
   `https://bestold.in/.well-known/assetlinks.json`

4. Verify it works by opening in browser:
   ```
   https://bestold.in/.well-known/assetlinks.json
   ```

---

### Step 5: Build the Android App

Back on your computer, inside the `bestold-app/` folder:

```bash
bubblewrap build
```

This creates:
- `app-release-signed.apk` — for testing on your phone
- `app-release-bundle.aab` — **this is what you upload to Play Store**

---

### Step 6: Test on Your Android Phone

Install the APK and confirm:
- App opens with **NO Chrome address bar** (this means assetlinks.json is working)
- Home page loads
- Seller dashboard and product pages work

```bash
adb install app-release-signed.apk
```

Or email the APK to yourself and install.

---

### Step 7: Create Google Play Console Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Pay **$25 one-time developer fee**
4. Complete your developer profile

---

### Step 8: Create Your App Listing

In Play Console:
1. Click **Create app**
2. Fill:
   - App name: **BESTOLD**
   - Default language: English
   - App or game: **App**
   - Free or paid: **Free**
3. Go to **Production** → **Create new release**
4. Upload your `app-release-bundle.aab` file

---

### Step 9: Complete Store Listing Details

| Item | Required | Tip |
|------|----------|-----|
| App icon | ✅ Yes | Use `public/icon-512x512.png` |
| Feature graphic | ✅ Yes | 1024×500 banner (make in Canva) |
| Phone screenshots | ✅ Yes | 2–8 screenshots of your app |
| Short description | ✅ Yes | ~80 characters |
| Full description | ✅ Yes | Detail features: sell, buy, chat, stores |
| Privacy policy URL | ✅ Yes | Link to `https://bestold.in/privacy` |
| Content rating | ✅ Yes | Answer questionnaire → Shopping |
| Target countries | ✅ Yes | Start with India |

---

### Step 10: Submit for Review

1. Review everything
2. Click **Start rollout to Production**
3. Google reviews in **1–3 days**
4. Once approved, your app appears on Play Store!

---

## Quick Checklist

- [ ] Install Bubblewrap CLI on your computer
- [ ] Run `bubblewrap init` with your manifest URL
- [ ] Run `bubblewrap fingerprint` and copy SHA-256
- [ ] Paste SHA-256 into `public/.well-known/assetlinks.json`
- [ ] Rebuild & redeploy website so assetlinks.json goes live
- [ ] Verify `https://bestold.in/.well-known/assetlinks.json` works
- [ ] Run `bubblewrap build` to get `.aab`
- [ ] Test APK on your phone (no address bar = success)
- [ ] Create Play Console account ($25)
- [ ] Upload `.aab` and fill store listing
- [ ] Submit for review

---

## How App Updates Work After Launch

| Change | What You Do |
|--------|-------------|
| Website content/feature updates | Edit through Medo → rebuild website → deploy. App reflects instantly. |
| App name / icon / colors | Re-run `bubblewrap init`, then `bubblewrap build`, upload new `.aab` to Play Console. |
| Change signing key | Update `assetlinks.json` SHA-256, redeploy website, upload new `.aab`. |

**You do NOT need a new app version for website changes.** The app is a wrapper.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Chrome address bar still shows in app | `assetlinks.json` not found or SHA-256 mismatch | Verify URL is live, SHA-256 is correct, app was rebuilt after fix |
| Offline pages show blank | Service worker not caching properly | Service worker updated — rebuild and redeploy website |
| App says "URL not verified" | Digital Asset Links missing | Ensure `.well-known/assetlinks.json` is accessible at your domain root |
| `bubblewrap` command not found | Node.js not installed or not in PATH | Install Node.js from nodejs.org, restart terminal |

---

## iOS (App Store) — Optional Later

For iPhone, you have two options:

| Option | Effort | Cost |
|--------|--------|------|
| **Add to Home Screen** | Zero | Free — users tap Share → Add to Home Screen |
| **Capacitor native wrapper** | 1–2 days | $99/year Apple Developer account + Mac + Xcode |

Recommendation: **Launch on Android first** via this guide. Add iOS later if needed.
