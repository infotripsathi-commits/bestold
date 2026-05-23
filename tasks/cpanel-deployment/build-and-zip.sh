#!/bin/bash
# BESTOLD — One-Click Build & ZIP for cPanel Deployment
# Run this script locally after setting your .env.production file
#
# USAGE:
#   chmod +x build-and-zip.sh
#   ./build-and-zip.sh
#
# Then upload the generated bestold-deploy.zip to cPanel and extract it.

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_DIR="${PROJECT_ROOT}/tasks/cpanel-deployment"
BUILD_DIR="${PROJECT_ROOT}/dist"
TEMP_DIR="${PROJECT_ROOT}/.cpanel-deploy-temp"
ZIP_NAME="bestold-deploy.zip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BESTOLD cPanel Deployment Builder${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ─── Step 1: Check Node.js ─────────────────────────────────────────────────
echo -e "${YELLOW}[1/6] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed.${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//')
echo "Node.js version: $NODE_VERSION"

# ─── Step 2: Install dependencies ────────────────────────────────────────────
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
cd "$PROJECT_ROOT"
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo -e "${RED}ERROR: Neither pnpm nor npm found.${NC}"
    echo "Install pnpm: npm install -g pnpm"
    exit 1
fi

# ─── Step 3: Build for production ────────────────────────────────────────────
echo -e "${YELLOW}[3/6] Building production bundle...${NC}"
cd "$PROJECT_ROOT"
if command -v pnpm &> /dev/null; then
    pnpm run build
elif command -v npm &> /dev/null; then
    npm run build
fi

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}ERROR: Build failed — dist/ folder not found.${NC}"
    echo "Check the build output above for errors."
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# ─── Step 4: Prepare temp folder ───────────────────────────────────────────
echo -e "${YELLOW}[4/6] Preparing deployment package...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy dist/ contents into temp folder
cp -r "$BUILD_DIR/"* "$TEMP_DIR/"

# Copy .htaccess into temp folder
if [ -f "${DEPLOY_DIR}/.htaccess" ]; then
    cp "${DEPLOY_DIR}/.htaccess" "$TEMP_DIR/.htaccess"
else
    echo -e "${YELLOW}WARNING: .htaccess not found in cpanel-deployment/. Creating a basic one...${NC}"
    cat > "$TEMP_DIR/.htaccess" << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
AddType application/javascript .js
AddType application/javascript .mjs
AddType font/woff2 .woff2
AddType font/woff .woff
AddType image/webp .webp
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript
</IfModule>
Options -Indexes
ErrorDocument 404 /index.html
EOF
fi

# ─── Step 5: Create ZIP ────────────────────────────────────────────────────
echo -e "${YELLOW}[5/6] Creating ZIP archive...${NC}"
cd "$TEMP_DIR"
if command -v zip &> /dev/null; then
    zip -r "${DEPLOY_DIR}/${ZIP_NAME}" .
else
    echo -e "${YELLOW}zip command not found, trying PowerShell / 7z...${NC}"
    if command -v 7z &> /dev/null; then
        7z a "${DEPLOY_DIR}/${ZIP_NAME}" ./*
    elif command -v powershell &> /dev/null; then
        powershell -Command "Compress-Archive -Path '*' -DestinationPath '${DEPLOY_DIR}/${ZIP_NAME}' -Force"
    else
        echo -e "${RED}ERROR: No ZIP utility found (tried: zip, 7z, powershell).${NC}"
        echo "Install zip: sudo apt-get install zip"
        exit 1
    fi
fi

# ─── Step 6: Clean up and report ─────────────────────────────────────────
echo -e "${YELLOW}[6/6] Cleaning up...${NC}"
rm -rf "$TEMP_DIR"

ZIP_SIZE=$(du -h "${DEPLOY_DIR}/${ZIP_NAME}" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT PACKAGE READY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "File: ${DEPLOY_DIR}/${ZIP_NAME}"
echo -e "Size: ${ZIP_SIZE}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Log in to cPanel"
echo "2. Open File Manager"
echo "3. Go to public_html/ (or your domain folder)"
echo "4. DELETE all old files in that folder first"
echo "5. Upload ${ZIP_NAME}"
echo "6. Right-click → Extract"
echo "7. Visit your website!"
echo ""
