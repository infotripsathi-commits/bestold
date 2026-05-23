import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, RefreshCw, MousePointer } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalyticsData {
  totalViews: number;
  last30Days: number;
  last7Days: number;
  refreshClicks: number;
  reinstallClicks: number;
  dailyTrend: { date: string; views: number }[];
  userBreakdown: {
    buyers: number;
    sellers: number;
    emailRegistered: number;
    googleRegistered: number;
  };
}

export default function AdminIconPreviewAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    last30Days: 0,
    last7Days: 0,
    refreshClicks: 0,
    reinstallClicks: 0,
    dailyTrend: [],
    userBreakdown: {
      buyers: 0,
      sellers: 0,
      emailRegistered: 0,
      googleRegistered: 0,
    },
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total views
      const { count: totalViews } = await supabase
        .from('icon_preview_views')
        .select('*', { count: 'exact', head: true })
        .eq('view_type', 'page_view');

      // Get last 30 days views
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: last30Days } = await supabase
        .from('icon_preview_views')
        .select('*', { count: 'exact', head: true })
        .eq('view_type', 'page_view')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get last 7 days views
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: last7Days } = await supabase
        .from('icon_preview_views')
        .select('*', { count: 'exact', head: true })
        .eq('view_type', 'page_view')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get refresh clicks
      const { count: refreshClicks } = await supabase
        .from('icon_preview_views')
        .select('*', { count: 'exact', head: true })
        .eq('view_type', 'refresh_click');

      // Get reinstall clicks
      const { count: reinstallClicks } = await supabase
        .from('icon_preview_views')
        .select('*', { count: 'exact', head: true })
        .eq('view_type', 'reinstall_click');

      // Get daily trend for last 30 days
      const { data: dailyData } = await supabase
        .from('icon_preview_views')
        .select('created_at')
        .eq('view_type', 'page_view')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Process daily trend
      const dailyTrend = processDailyTrend(dailyData || []);

      // Get user breakdown
      const { data: viewsWithProfiles } = await supabase
        .from('icon_preview_views')
        .select(`
          user_id,
          profiles!inner(role, email)
        `)
        .eq('view_type', 'page_view');

      const userBreakdown = processUserBreakdown(viewsWithProfiles || []);

      setAnalytics({
        totalViews: totalViews || 0,
        last30Days: last30Days || 0,
        last7Days: last7Days || 0,
        refreshClicks: refreshClicks || 0,
        reinstallClicks: reinstallClicks || 0,
        dailyTrend,
        userBreakdown,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processDailyTrend = (data: any[]) => {
    const dailyMap = new Map<string, number>();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    // Count views per day
    data.forEach((item) => {
      const dateStr = item.created_at.split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    });

    // Convert to array
    return Array.from(dailyMap.entries()).map(([date, views]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
    }));
  };

  const processUserBreakdown = (data: any[]) => {
    const breakdown = {
      buyers: 0,
      sellers: 0,
      emailRegistered: 0,
      googleRegistered: 0,
    };

    const uniqueUsers = new Map();

    data.forEach((item) => {
      if (!uniqueUsers.has(item.user_id)) {
        uniqueUsers.set(item.user_id, item.profiles);
        
        if (item.profiles.role === 'buyer') {
          breakdown.buyers++;
        } else if (item.profiles.role === 'seller') {
          breakdown.sellers++;
        }

        // Check if email contains oauth provider indicator
        if (item.profiles.email && item.profiles.email.includes('@')) {
          // This is a simplified check - in production, you'd have a proper field
          breakdown.emailRegistered++;
        }
      }
    });

    return breakdown;
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Views (All Time)', analytics.totalViews],
      ['Views (Last 30 Days)', analytics.last30Days],
      ['Views (Last 7 Days)', analytics.last7Days],
      ['Refresh Button Clicks', analytics.refreshClicks],
      ['Reinstall Button Clicks', analytics.reinstallClicks],
      [''],
      ['User Breakdown', ''],
      ['Buyers', analytics.userBreakdown.buyers],
      ['Sellers', analytics.userBreakdown.sellers],
      [''],
      ['Daily Trend (Last 30 Days)', ''],
      ['Date', 'Views'],
      ...analytics.dailyTrend.map((item) => [item.date, item.views]),
    ];

    const csv = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon-preview-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">App Icon Preview Analytics</h1>
          <p className="text-muted-foreground">
            Track user engagement with the App Icon Preview feature
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.last30Days.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.last7Days.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Button Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.refreshClicks + analytics.reinstallClicks).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.refreshClicks} refresh, {analytics.reinstallClicks} reinstall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily View Trend</CardTitle>
          <CardDescription>Page views over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Page Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Type Breakdown</CardTitle>
            <CardDescription>Unique users who viewed the icon preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Buyers</span>
                <span className="text-2xl font-bold">{analytics.userBreakdown.buyers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sellers</span>
                <span className="text-2xl font-bold">{analytics.userBreakdown.sellers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Button Interaction Details</CardTitle>
            <CardDescription>User interactions with feature buttons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Refresh Icon Preview</span>
                </div>
                <span className="text-2xl font-bold">{analytics.refreshClicks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reinstall App</span>
                </div>
                <span className="text-2xl font-bold">{analytics.reinstallClicks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
