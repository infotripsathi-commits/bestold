# Image Compression Migration Scripts

This directory contains scripts for compressing existing images in the BESTOLD database.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Ensure parent `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 3. Test Run

```bash
node compress-existing-images-sharp.js --dry-run --limit=10
```

### 4. Full Migration

```bash
node compress-existing-images-sharp.js
```

## Scripts

### compress-existing-images-sharp.js

Main migration script using Sharp library for image compression.

**Features**:
- Compresses images to 100KB max
- WebP format support
- Batch processing
- Progress logging
- Error handling
- Database updates

**Usage**:
```bash
# Dry run (no changes)
node compress-existing-images-sharp.js --dry-run

# Test on 10 images
node compress-existing-images-sharp.js --dry-run --limit=10

# Compress products only
node compress-existing-images-sharp.js --table=products

# Full migration
node compress-existing-images-sharp.js
```

**Options**:
- `--dry-run` - Preview without changes
- `--batch-size=N` - Process N images at once (default: 5)
- `--table=NAME` - Only process specific table
- `--limit=N` - Limit total images to process
- `--format=TYPE` - Output format (webp, jpeg, auto)

## Documentation

See `../EXISTING_IMAGES_MIGRATION_GUIDE.md` for complete documentation.

## Requirements

- Node.js 18+
- npm or pnpm
- Supabase service role key
- Internet connection

## Support

For issues or questions, refer to the troubleshooting section in the migration guide.
