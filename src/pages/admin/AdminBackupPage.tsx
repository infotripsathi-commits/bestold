import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, Upload, Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/db/api';
import AdminNav from '@/components/layouts/AdminNav';

export default function AdminBackupPage() {
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string>('');

  const handleExportData = async () => {
    try {
      setLoading(true);
      setBackupProgress('Starting backup...');

      // List of tables to backup
      const tables = [
        'profiles',
        'categories',
        'subcategories',
        'locations',
        'stores',
        'products',
        'reviews',
        'conversations',
        'messages',
        'follows',
        'store_banners',
        'site_settings',
        'email_configuration',
        'phone_brands',
        'phone_models',
        'phone_conditions',
        'phone_age_options',
        'phone_variants',
        'phone_submissions',
        'store_promotions',
        'promotion_payments',
      ];

      const backup: Record<string, any[]> = {};
      let completedTables = 0;

      for (const table of tables) {
        setBackupProgress(`Backing up ${table}... (${completedTables + 1}/${tables.length})`);
        
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');

          if (error) {
            console.error(`Error backing up ${table}:`, error);
            backup[table] = [];
          } else {
            backup[table] = data || [];
          }
        } catch (err) {
          console.error(`Error backing up ${table}:`, err);
          backup[table] = [];
        }

        completedTables++;
      }

      setBackupProgress('Preparing download...');

      // Create backup file
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables: backup,
        metadata: {
          totalTables: tables.length,
          totalRecords: Object.values(backup).reduce((sum, records) => sum + records.length, 0),
        },
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bestold-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup completed successfully!');
      setBackupProgress('');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
      setBackupProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (tableName: string) => {
    try {
      setLoading(true);
      toast.info(`Exporting ${tableName} as CSV...`);

      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error(`No data found in ${tableName}`);
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        ),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${tableName} exported successfully!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(`Failed to export ${tableName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setBackupProgress('Reading backup file...');

      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.tables) {
        toast.error('Invalid backup file format');
        return;
      }

      setBackupProgress('Restoring data...');

      const tables = Object.keys(backupData.tables);
      let restoredTables = 0;
      let totalRecords = 0;

      for (const table of tables) {
        const records = backupData.tables[table];
        if (!records || records.length === 0) continue;

        setBackupProgress(`Restoring ${table}... (${restoredTables + 1}/${tables.length})`);

        try {
          // Note: This will insert records, but may fail if IDs already exist
          // In production, you might want to use upsert or handle conflicts
          const { error } = await supabase
            .from(table)
            .insert(records);

          if (error) {
            console.error(`Error restoring ${table}:`, error);
          } else {
            totalRecords += records.length;
          }
        } catch (err) {
          console.error(`Error restoring ${table}:`, err);
        }

        restoredTables++;
      }

      toast.success(`Backup restored! ${totalRecords} records imported.`);
      setBackupProgress('');
    } catch (error) {
      console.error('Error importing backup:', error);
      toast.error('Failed to import backup');
      setBackupProgress('');
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const quickExportTables = [
    { name: 'profiles', label: 'Users', icon: '👥' },
    { name: 'stores', label: 'Stores', icon: '🏪' },
    { name: 'products', label: 'Products', icon: '📦' },
    { name: 'reviews', label: 'Reviews', icon: '⭐' },
    { name: 'categories', label: 'Categories', icon: '📁' },
    { name: 'locations', label: 'Locations', icon: '📍' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Backup & Restore</h1>
          <p className="text-muted-foreground mt-1">
            Export and import your database data
          </p>
        </div>

        {/* Progress Indicator */}
        {backupProgress && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-sm font-medium">{backupProgress}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Backup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Full Database Backup</CardTitle>
              </div>
              <CardDescription>
                Export all tables as a single JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>All tables included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Preserves relationships</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Easy to restore</span>
                </div>
              </div>

              <Button
                onClick={handleExportData}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Creating Backup...' : 'Download Full Backup'}
              </Button>

              <p className="text-xs text-muted-foreground">
                This will download a JSON file containing all your data. Keep it safe!
              </p>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Restore from Backup</CardTitle>
              </div>
              <CardDescription>
                Import data from a backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">Warning</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This will add data to existing tables</li>
                      <li>Duplicate IDs may cause errors</li>
                      <li>Test on a backup first</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  disabled={loading}
                  className="hidden"
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input">
                  <Button
                    asChild
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? 'Restoring...' : 'Upload Backup File'}
                    </span>
                  </Button>
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Select a JSON backup file to restore your data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Export */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Export (CSV)</CardTitle>
            <CardDescription>
              Export individual tables as CSV files for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickExportTables.map((table) => (
                <Button
                  key={table.name}
                  variant="outline"
                  onClick={() => handleExportCSV(table.name)}
                  disabled={loading}
                  className="h-auto py-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">{table.icon}</span>
                  <span className="text-xs">{table.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backup Schedule Info */}
        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Backup Best Practices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">📅 Regular Backups</h4>
              <p className="text-muted-foreground">
                Create backups daily or weekly depending on your data change frequency
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">💾 Multiple Locations</h4>
              <p className="text-muted-foreground">
                Store backups in multiple locations (local, cloud storage, external drive)
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">🧪 Test Restores</h4>
              <p className="text-muted-foreground">
                Periodically test your backups by restoring them to a test environment
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">🔒 Secure Storage</h4>
              <p className="text-muted-foreground">
                Backup files contain sensitive data. Store them securely and encrypt if possible
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">📝 Version Control</h4>
              <p className="text-muted-foreground">
                Keep multiple backup versions with dates in filenames
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Native Backup Info */}
        <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-lg">Supabase Native Backups</CardTitle>
            <CardDescription>
              Supabase provides automatic daily backups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Your Supabase project includes automatic daily backups that are retained for 7 days (free tier) or longer (paid plans).
            </p>
            <div className="space-y-2">
              <p className="font-semibold">To access Supabase backups:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Go to your Supabase Dashboard</li>
                <li>Select your project</li>
                <li>Navigate to Database → Backups</li>
                <li>Download or restore from available backups</li>
              </ol>
            </div>
            <p className="text-muted-foreground">
              Use this page for manual backups, data exports, or when you need immediate backups before major changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
