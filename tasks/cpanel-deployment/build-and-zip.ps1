# BESTOLD — Build & ZIP for cPanel Deployment (Windows PowerShell)
# Place this file in your project root and run: .\build-and-zip.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot | Split-Path -Parent | Split-Path -Parent
$DeployDir = "$ProjectRoot\tasks\cpanel-deployment"
$BuildDir = "$ProjectRoot\dist"
$TempDir = "$ProjectRoot\.cpanel-deploy-temp"
$ZipName = "bestold-deploy.zip"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  BESTOLD cPanel Deployment Builder     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# ─── Step 1: Check Node.js ──────────────────────────────────────────────
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $NodeVersion = node -v
    Write-Host "Node.js version: $NodeVersion"
} catch {
    Write-Host "ERROR: Node.js is not installed." -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/"
    exit 1
}

# ─── Step 2: Install dependencies ────────────────────────────────────────
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
} else {
    Write-Host "ERROR: Neither pnpm nor npm found." -ForegroundColor Red
    exit 1
}

# ─── Step 3: Build for production ────────────────────────────────────────
Write-Host "[3/6] Building production bundle..." -ForegroundColor Yellow
Set-Location $ProjectRoot

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run build
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run build
}

if (-not (Test-Path $BuildDir)) {
    Write-Host "ERROR: Build failed — dist/ folder not found." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# ─── Step 4: Prepare temp folder ─────────────────────────────────────────
Write-Host "[4/6] Preparing deployment package..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy dist/ contents into temp folder
Copy-Item "$BuildDir\*" $TempDir -Recurse

# Copy .htaccess into temp folder
$HtaccessSource = "$DeployDir\.htaccess"
if (Test-Path $HtaccessSource) {
    Copy-Item $HtaccessSource "$TempDir\.htaccess"
} else {
    Write-Host "WARNING: .htaccess not found. Creating basic one..." -ForegroundColor Yellow
    @"
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
AddType application/javascript .js
AddType application/javascript .mjs
Options -Indexes
ErrorDocument 404 /index.html
"@ | Set-Content "$TempDir\.htaccess"
}

# ─── Step 5: Create ZIP ─────────────────────────────────────────────────
Write-Host "[5/6] Creating ZIP archive..." -ForegroundColor Yellow
Set-Location $TempDir

$ZipPath = "$DeployDir\$ZipName"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Use Compress-Archive (built into Windows)
Compress-Archive -Path "*" -DestinationPath $ZipPath -Force

# ─── Step 6: Clean up and report ────────────────────────────────────────
Write-Host "[6/6] Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue

$ZipSize = (Get-Item $ZipPath).Length / 1MB
$ZipSizeFormatted = "{0:N2} MB" -f $ZipSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT PACKAGE READY!             " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File: $ZipPath"
Write-Host "Size: $ZipSizeFormatted"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Log in to cPanel"
Write-Host "2. Open File Manager"
Write-Host "3. Go to public_html/ (or your domain folder)"
Write-Host "4. DELETE all old files in that folder first"
Write-Host "5. Upload $ZipName"
Write-Host "6. Right-click -> Extract"
Write-Host "7. Visit your website!"
Write-Host ""
