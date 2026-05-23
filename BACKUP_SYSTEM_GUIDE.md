# Backup & Restore System - Complete Guide

## Overview

A comprehensive backup and restore system that allows administrators to export and import all database data. The system supports full database backups in JSON format, individual table exports in CSV format, and easy restoration of backed-up data.

## Features

✅ **Full Database Backup** - Export all tables as a single JSON file
✅ **Individual Table Export** - Export specific tables as CSV files
✅ **Data Restoration** - Import data from backup files
✅ **Progress Tracking** - Real-time progress indicators during backup/restore
✅ **Multiple Formats** - JSON for full backups, CSV for individual tables
✅ **Relationship Preservation** - Maintains data relationships in JSON backups
✅ **Quick Export** - One-click export for common tables
✅ **Best Practices Guide** - Built-in recommendations for backup management

## Access

**Location:** Admin Panel → Backup

**URL:** `/admin/backup`

**Permissions:** Admin only

## Features in Detail

### 1. Full Database Backup

**What it does:**
- Exports all database tables to a single JSON file
- Preserves data relationships and structure
- Includes metadata (timestamp, version, record counts)
- Easy to restore

**Tables included:**
- profiles (users)
- categories & subcategories
- locations
- stores & store_banners
- products
- reviews
- conversations & messages
- wishlist & follows
- site_settings
- email_configuration
- phone_brands, phone_models, phone_conditions, phone_age_options, phone_variants
- phone_submissions
- store_promotions & promotion_payments

**File format:**
```json
{
  "version": "1.0",
  "timestamp": "2026-03-28T10:30:00.000Z",
  "tables": {
    "profiles": [...],
    "stores": [...],
    "products": [...]
  },
  "metadata": {
    "totalTables": 22,
    "totalRecords": 1543
  }
}
```

**File naming:**
`bestold-backup-YYYY-MM-DD.json`

Example: `bestold-backup-2026-03-28.json`

### 2. Individual Table Export (CSV)

**What it does:**
- Exports a single table as CSV file
- Perfect for data analysis in Excel/Google Sheets
- Smaller file size
- Easy to view and edit

**Quick export buttons:**
- 👥 Users (profiles)
- 🏪 Stores
- 📦 Products
- ⭐ Reviews
- 📁 Categories
- 📍 Locations

**File format:**
Standard CSV with headers and quoted values

**File naming:**
`[table-name]-YYYY-MM-DD.csv`

Example: `products-2026-03-28.csv`

### 3. Data Restoration

**What it does:**
- Imports data from JSON backup files
- Adds records to existing tables
- Preserves data structure
- Shows progress during import

**Important notes:**
- ⚠️ This adds data to existing tables (does not replace)
- ⚠️ Duplicate IDs may cause errors
- ⚠️ Test on a backup/staging environment first
- ⚠️ Cannot undo after import

## How to Use

### Creating a Full Backup

1. **Navigate to Backup Page**
   - Login as admin
   - Go to Admin Panel
   - Click "Backup" in navigation

2. **Start Backup**
   - Click "Download Full Backup" button
   - Wait for progress indicator
   - File will download automatically

3. **Save Backup File**
   - Store in a secure location
   - Keep multiple versions
   - Include date in filename (already done automatically)

**Time estimate:** 10-30 seconds depending on data size

### Exporting Individual Tables

1. **Choose Table**
   - Click on the table icon you want to export
   - Examples: Users, Stores, Products, etc.

2. **Download CSV**
   - File downloads automatically
   - Open in Excel, Google Sheets, or any CSV viewer

**Time estimate:** 5-10 seconds per table

### Restoring from Backup

1. **Prepare**
   - ⚠️ **IMPORTANT:** Test on a staging environment first
   - Ensure backup file is valid JSON
   - Backup current data before restoring

2. **Upload Backup**
   - Click "Upload Backup File" button
   - Select your JSON backup file
   - Wait for progress indicator

3. **Verify**
   - Check that data was imported correctly
   - Verify record counts
   - Test application functionality

**Time estimate:** 30-60 seconds depending on data size

## Backup Strategies

### Daily Backups

**For active production sites:**
- Create backup every day
- Keep last 7 days of backups
- Store in multiple locations

**Automation:**
- Set a daily reminder
- Use calendar/task manager
- Consider automated scripts (advanced)

### Weekly Backups

**For low-activity sites:**
- Create backup every week
- Keep last 4 weeks of backups
- Store in cloud storage

### Before Major Changes

**Always backup before:**
- Software updates
- Database migrations
- Bulk data operations
- Configuration changes
- Testing new features

### Storage Locations

**Recommended:**
1. **Local Storage** - Your computer/server
2. **Cloud Storage** - Google Drive, Dropbox, OneDrive
3. **External Drive** - USB drive, external HDD
4. **Version Control** - Git (for small datasets)

**Never:**
- Store only in one location
- Store on the same server as the database
- Store without encryption (for sensitive data)

## Best Practices

### 1. Regular Schedule

✅ **Do:**
- Set a consistent backup schedule
- Automate reminders
- Document backup procedures
- Assign backup responsibility

❌ **Don't:**
- Wait until something goes wrong
- Rely on memory
- Skip backups because "nothing changed"

### 2. Multiple Versions

✅ **Do:**
- Keep at least 3-7 backup versions
- Use dated filenames
- Organize in folders by month/year
- Delete very old backups (>6 months)

❌ **Don't:**
- Keep only one backup
- Overwrite previous backups
- Keep unlimited backups (storage cost)

### 3. Test Restores

✅ **Do:**
- Test restore process monthly
- Use a test/staging environment
- Verify data integrity after restore
- Document restore procedures

❌ **Don't:**
- Assume backups work without testing
- Test on production database
- Skip verification steps

### 4. Secure Storage

✅ **Do:**
- Encrypt backup files (if sensitive data)
- Use secure cloud storage
- Limit access to backup files
- Use strong passwords for storage

❌ **Don't:**
- Store backups publicly
- Share backup files via email
- Use unencrypted storage for sensitive data

### 5. Documentation

✅ **Do:**
- Document backup procedures
- Note backup locations
- Record last backup date
- Keep restore instructions handy

❌ **Don't:**
- Rely on memory
- Assume others know the process
- Skip documentation

## File Formats

### JSON Format (Full Backup)

**Advantages:**
- Preserves data structure
- Maintains relationships
- Easy to restore
- Human-readable
- Supports complex data types

**Disadvantages:**
- Larger file size
- Not easily editable
- Requires JSON viewer for inspection

**Best for:**
- Full database backups
- Disaster recovery
- Migration to new environment
- Complete data restoration

### CSV Format (Individual Tables)

**Advantages:**
- Smaller file size
- Opens in Excel/Sheets
- Easy to view and edit
- Universal format
- Good for analysis

**Disadvantages:**
- Loses data relationships
- Complex data types become strings
- Harder to restore
- One table at a time

**Best for:**
- Data analysis
- Reporting
- Sharing specific data
- Quick exports

## Troubleshooting

### Backup Fails

**Symptoms:**
- Error message during backup
- Incomplete backup file
- Browser crashes

**Solutions:**
1. Check browser console for errors
2. Try smaller table exports first
3. Clear browser cache
4. Use a different browser
5. Check database permissions

### Restore Fails

**Symptoms:**
- Error message during restore
- Data not imported
- Duplicate key errors

**Solutions:**
1. **Duplicate IDs:**
   - Clear target tables first (⚠️ dangerous)
   - Or modify IDs in backup file
   - Or use staging environment

2. **Invalid JSON:**
   - Validate JSON file (jsonlint.com)
   - Check file wasn't corrupted
   - Re-download backup

3. **Permission Errors:**
   - Verify admin access
   - Check RLS policies
   - Review database permissions

### Large File Issues

**Symptoms:**
- Backup takes very long
- Browser becomes unresponsive
- Download fails

**Solutions:**
1. Export individual tables instead
2. Use CSV format for large tables
3. Increase browser memory limit
4. Use database tools (pg_dump) for very large databases

### File Won't Download

**Symptoms:**
- Button clicks but no download
- Download starts but fails
- File is 0 bytes

**Solutions:**
1. Check browser download settings
2. Disable popup blockers
3. Try different browser
4. Check disk space
5. Check browser console for errors

## Advanced Usage

### Automated Backups

**Using Cron Jobs (Linux/Mac):**
```bash
# Create a script: backup.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
curl -X POST https://your-app.com/api/backup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o "backup-$DATE.json"

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

**Using Task Scheduler (Windows):**
1. Create PowerShell script
2. Open Task Scheduler
3. Create new task
4. Set trigger (daily, weekly)
5. Set action (run script)

### Backup to Cloud Storage

**Google Drive:**
- Use Google Drive desktop app
- Save backups to synced folder
- Automatic cloud backup

**Dropbox:**
- Similar to Google Drive
- Install desktop app
- Save to Dropbox folder

**AWS S3:**
- Use AWS CLI
- Upload backups to S3 bucket
- Set lifecycle policies

### Selective Restore

**Restore specific tables:**
1. Open backup JSON file
2. Extract specific table data
3. Create new JSON with only that table
4. Import the modified file

**Example:**
```json
{
  "version": "1.0",
  "timestamp": "2026-03-28T10:30:00.000Z",
  "tables": {
    "products": [...]
  },
  "metadata": {
    "totalTables": 1,
    "totalRecords": 150
  }
}
```

## Supabase Native Backups

### Automatic Backups

**Supabase provides:**
- Daily automatic backups
- 7-day retention (free tier)
- 30-day retention (pro tier)
- Point-in-time recovery (enterprise)

**Access:**
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to Database → Backups
4. View available backups
5. Download or restore

### When to Use Each

**Use BestOld Backup System:**
- Manual backups before changes
- Data exports for analysis
- Quick table exports
- Custom backup schedules
- Offline storage

**Use Supabase Native Backups:**
- Disaster recovery
- Point-in-time restore
- Automated daily backups
- Database-level restore
- Professional backup management

## Security Considerations

### Backup File Security

**Backup files contain:**
- User data (emails, names, etc.)
- Store information
- Product details
- Reviews and messages
- Email configurations (API keys!)
- All sensitive data

**Security measures:**
1. **Encrypt backup files**
   - Use 7-Zip with password
   - Use VeraCrypt
   - Use cloud storage encryption

2. **Limit access**
   - Only admins should have backups
   - Use secure file sharing
   - Don't email backup files

3. **Secure storage**
   - Use password-protected cloud storage
   - Enable 2FA on storage accounts
   - Use encrypted external drives

4. **Delete old backups**
   - Don't keep backups forever
   - Follow data retention policies
   - Securely delete old files

### API Keys in Backups

**Warning:** Backup files include email_configuration table with API keys!

**Best practices:**
1. Store backups securely
2. Encrypt backup files
3. Rotate API keys regularly
4. Don't share backup files
5. Delete API keys from backups if sharing for testing

## Compliance & Regulations

### GDPR Compliance

**Right to be forgotten:**
- Backups may contain deleted user data
- Document backup retention policy
- Delete old backups regularly
- Inform users about backup retention

**Data portability:**
- Users can request their data
- Export specific user data
- Provide in readable format (CSV)

### Data Retention

**Recommended policies:**
- Keep backups for 30-90 days
- Delete older backups
- Document retention policy
- Follow industry regulations

## Monitoring & Alerts

### Backup Monitoring

**Track:**
- Last backup date
- Backup file size
- Backup success/failure
- Storage space used

**Set alerts for:**
- Backup not created in 7 days
- Backup file size anomalies
- Storage space running low
- Backup failures

### Backup Log

**Maintain a log:**
```
Date       | Type  | Size   | Status  | Notes
-----------|-------|--------|---------|------------------
2026-03-28 | Full  | 15 MB  | Success | Before update
2026-03-27 | Full  | 14 MB  | Success | Daily backup
2026-03-26 | CSV   | 2 MB   | Success | Products export
```

## FAQ

**Q: How often should I backup?**
A: Daily for active sites, weekly for low-activity sites, always before major changes.

**Q: Where should I store backups?**
A: Multiple locations: local storage, cloud storage, and external drive.

**Q: Can I restore to a different environment?**
A: Yes, but test thoroughly. Database structure must match.

**Q: What if restore fails with duplicate errors?**
A: The restore adds data to existing tables. Clear tables first or use staging environment.

**Q: Are backups encrypted?**
A: No, you must encrypt them yourself if needed.

**Q: Can I automate backups?**
A: Not built-in, but you can use cron jobs or task scheduler with API calls.

**Q: How long do backups take?**
A: 10-30 seconds for full backup, 5-10 seconds for individual tables.

**Q: What's the file size?**
A: Depends on data size. Typical: 5-50 MB for small sites, 100+ MB for large sites.

**Q: Can I edit backup files?**
A: Yes, JSON files are text-based. Use a JSON editor. Be careful with data structure.

**Q: Do backups include images?**
A: No, only database data. Images are stored in Supabase Storage separately.

**Q: How do I backup Supabase Storage?**
A: Use Supabase Dashboard → Storage → Download files, or use Supabase CLI.

## Support

**For backup issues:**
1. Check browser console for errors
2. Verify admin permissions
3. Test with smaller exports
4. Contact support with error details

**For restore issues:**
1. Validate JSON file format
2. Test on staging environment first
3. Check for duplicate ID conflicts
4. Review database logs

---

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** ✅ Production Ready
