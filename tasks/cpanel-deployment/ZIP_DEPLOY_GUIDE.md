# BESTOLD — ZIP Deployment Guide (Easiest Method)

This is the **easiest** way to deploy. You create one ZIP file locally, upload it to cPanel, and extract it — done.

---

## 📦 Method 1: Automated Script (Recommended)

### Step 1 — Open Terminal

**Mac/Linux:** Open Terminal
**Windows:** Open PowerShell (or Command Prompt)

### Step 2 — Navigate to Your Project Folder

```bash
cd /path/to/your/project/app-ahn8efyun8ch
```

> **Windows example:** `cd C:\Users\YourName\Desktop\app-ahn8efyun8ch`

### Step 3 — Set Up Environment Variables

In your project folder, create a file named `.env.production`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here
VITE_APP_ID=app-ahn8efyun8ch
```

> Get these values from: Supabase Dashboard → Settings → API

### Step 4 — Run the Build Script

**Mac/Linux:**
```bash
chmod +x tasks/cpanel-deployment/build-and-zip.sh
./tasks/cpanel-deployment/build-and-zip.sh
```

**Windows:**
```powershell
# Option A — Run commands manually:
pnpm install
pnpm run build

# Option B — Or use the PowerShell script (see below)
```

### Step 5 — Find Your ZIP File

After running, a file named **`bestold-deploy.zip`** will appear at:
```
app-ahn8efyun8ch/tasks/cpanel-deployment/bestold-deploy.zip
```

---

## 📦 Method 2: Manual ZIP (Windows / No Script)

If you can't run the script, do this:

### Step 1 — Build
Open Command Prompt or PowerShell in your project folder:
```powershell
pnpm install
pnpm run build
```

### Step 2 — Create the ZIP
1. Go to your project folder → find the **`dist/` folder**
2. Open the `dist/` folder
3. Copy the `.htaccess` file from `tasks/cpanel-deployment/.htaccess` and paste it into `dist/`
4. Select **ALL files** inside `dist/` (Ctrl+A)
5. Right-click → **Compress to ZIP file** (Windows 11) or **Send to → Compressed (zipped) folder** (Windows 10)
6. Rename the ZIP to `bestold-deploy.zip`

---

## 📤 Method 3: Upload & Extract in cPanel

### Step 1 — Clean Old Files (CRITICAL)
1. Log in to **cPanel**
2. Open **File Manager**
3. Go to `public_html/` (or your domain folder like `bestold.in/`)
4. **SELECT ALL** files
5. **DELETE** everything (or move to trash)

> ⚠️ **DO NOT skip this step!** Old files will cause conflicts.

### Step 2 — Upload ZIP
1. Click **Upload** button (top bar)
2. Select `bestold-deploy.zip` from your computer
3. Wait for upload to complete

### Step 3 — Extract ZIP
1. Right-click on `bestold-deploy.zip`
2. Click **Extract**
3. Make sure files extract to the **root** of `public_html/`, not a subfolder
4. Click **Extract File(s)**

### Step 4 — Verify Structure

Your folder should look like this:

```
public_html/
├── .htaccess          ✅
├── index.html           ✅
├── manifest.json        ✅
├── service-worker.js    ✅
└── assets/              ✅
    ├── index-xxx.js
    ├── index-xxx.css
    └── ...
```

> ⚠️ If you see a `dist/` subfolder, **move all files OUT of it** into `public_html/` directly.

### Step 5 — Visit Your Website

Open your browser and go to:
```
https://bestold.in
```

---

## 🖼️ Visual Guide

```
┌────────────────────────────────────────────────────────────┐
│  BEFORE (WRONG — your current state)                       │
│  public_html/                                              │
│  ├── app-ahn8efyun8ch/    ← Source code ❌                  │
│  ├── docs/                ← Documentation ❌                │
│  ├── src/                 ← React source ❌                 │
│  ├── *.md files           ← Markdown docs ❌               │
│  └── ...                                                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  AFTER (CORRECT — after extracting ZIP)                     │
│  public_html/                                              │
│  ├── .htaccess            ✅ Apache config                  │
│  ├── index.html           ✅ Entry HTML                     │
│  ├── manifest.json        ✅ PWA manifest                   │
│  ├── service-worker.js    ✅ Service worker                 │
│  └── assets/              ✅ JS/CSS/Images                  │
│      ├── index-abc123.js                                    │
│      ├── index-def456.css                                   │
│      └── ...                                                │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Quick Checklist

- [ ] Created `.env.production` with correct Supabase credentials
- [ ] Ran `pnpm run build` successfully
- [ ] ZIP file contains `index.html` at root level
- [ ] ZIP file contains `.htaccess`
- [ ] Deleted ALL old files from cPanel before uploading
- [ ] Extracted ZIP to root of `public_html/`
- [ ] No `src/` folder remains in cPanel
- [ ] Website loads at `https://bestold.in`

---

## 🛠️ Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| **Blank page** | Source code uploaded instead of `dist/` | Delete everything, rebuild, upload ZIP |
| **404 on refresh** | `.htaccess` missing | Upload `.htaccess` file |
| **Images don't load** | Supabase CORS not set | Add your domain to Supabase Storage CORS |
| **Login not working** | Auth URL config missing | Add `https://bestold.in` to Supabase Auth URLs |
| **Old version showing** | Browser cache | Press Ctrl+Shift+R to hard refresh |
| **ZIP too large** | Includes `node_modules/` | Make sure you ZIP only `dist/` contents, not the whole project |

---

## 📊 How Big Should the ZIP Be?

| File | Expected Size |
|------|-------------|
| `bestold-deploy.zip` | 2–6 MB |
| `index.html` | ~5 KB |
| `assets/` folder | 2–5 MB |

If your ZIP is **larger than 10 MB**, you probably included source code. Rebuild and ZIP only the `dist/` folder contents.
