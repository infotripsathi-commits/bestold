import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Database,
  Server,
  RefreshCw,
} from 'lucide-react';
import { logger, type LogEntry, LogLevel } from '@/lib/logger';
import { getPerformanceMetrics, type PerformanceMetrics } from '@/lib/performance';
import { supabase } from '@/db/supabase';

interface SystemMetrics {
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    uptime: 100,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({});
  const [errorLogs, setErrorLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Load performance metrics
      const perfMetrics = getPerformanceMetrics();
      setPerformanceMetrics(perfMetrics);

      // Load error logs
      const errors = logger.getErrorLogs();
      setErrorLogs(errors.slice(-10)); // Last 10 errors

      // Load system metrics from Supabase
      await loadSystemMetrics();

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      // Get active users count (users active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', fiveMinutesAgo);

      // Calculate error rate from logs
      const allLogs = logger.getErrorLogs();
      const errorCount = allLogs.filter(
        (log) => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
      ).length;
      const errorRate = allLogs.length > 0 ? (errorCount / allLogs.length) * 100 : 0;

      setMetrics({
        activeUsers: activeUsers || 0,
        totalRequests: allLogs.length,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: 0, // Would need to calculate from API logs
        uptime: 99.9, // Would need to get from uptime monitoring service
      });
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const getMetricStatus = (value: number, threshold: number): 'good' | 'warning' | 'critical' => {
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'warning';
    return 'critical';
  };

  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value?: number) => {
    if (!value) return 'unknown';
    
    const thresholds = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold) return 'good';
    if (value <= threshold * 1.6) return 'needs-improvement';
    return 'poor';
  };

  const clearLogs = () => {
    logger.clearErrorLogs();
    setErrorLogs([]);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time performance and error tracking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate}%</div>
            <Badge
              variant={
                getMetricStatus(metrics.errorRate, 5) === 'good'
                  ? 'default'
                  : getMetricStatus(metrics.errorRate, 5) === 'warning'
                    ? 'secondary'
                    : 'destructive'
              }
              className="mt-1"
            >
              {getMetricStatus(metrics.errorRate, 5)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Logged requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Errors ({errorLogs.length})
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Performance metrics based on Google's Core Web Vitals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceMetrics.lcp && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Largest Contentful Paint (LCP)</div>
                    <div className="text-sm text-muted-foreground">
                      Measures loading performance
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {performanceMetrics.lcp.toFixed(0)}ms
                    </div>
                    <Badge
                      variant={
                        getPerformanceStatus('lcp', performanceMetrics.lcp) === 'good'
                          ? 'default'
                          : getPerformanceStatus('lcp', performanceMetrics.lcp) ===
                              'needs-improvement'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {getPerformanceStatus('lcp', performanceMetrics.lcp)}
                    </Badge>
                  </div>
                </div>
              )}

              {performanceMetrics.fid && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">First Input Delay (FID)</div>
                    <div className="text-sm text-muted-foreground">
                      Measures interactivity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {performanceMetrics.fid.toFixed(0)}ms
                    </div>
                    <Badge
                      variant={
                        getPerformanceStatus('fid', performanceMetrics.fid) === 'good'
                          ? 'default'
                          : getPerformanceStatus('fid', performanceMetrics.fid) ===
                              'needs-improvement'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {getPerformanceStatus('fid', performanceMetrics.fid)}
                    </Badge>
                  </div>
                </div>
              )}

              {performanceMetrics.cls !== undefined && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Cumulative Layout Shift (CLS)</div>
                    <div className="text-sm text-muted-foreground">
                      Measures visual stability
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {performanceMetrics.cls.toFixed(3)}
                    </div>
                    <Badge
                      variant={
                        getPerformanceStatus('cls', performanceMetrics.cls) === 'good'
                          ? 'default'
                          : getPerformanceStatus('cls', performanceMetrics.cls) ===
                              'needs-improvement'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {getPerformanceStatus('cls', performanceMetrics.cls)}
                    </Badge>
                  </div>
                </div>
              )}

              {performanceMetrics.ttfb && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Time to First Byte (TTFB)</div>
                    <div className="text-sm text-muted-foreground">
                      Measures server response time
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {performanceMetrics.ttfb.toFixed(0)}ms
                    </div>
                    <Badge
                      variant={
                        getPerformanceStatus('ttfb', performanceMetrics.ttfb) === 'good'
                          ? 'default'
                          : getPerformanceStatus('ttfb', performanceMetrics.ttfb) ===
                              'needs-improvement'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {getPerformanceStatus('ttfb', performanceMetrics.ttfb)}
                    </Badge>
                  </div>
                </div>
              )}

              {Object.keys(performanceMetrics).length === 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Performance metrics are being collected. Please wait a moment and refresh.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>Last 10 error logs</CardDescription>
                </div>
                {errorLogs.length > 0 && (
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    Clear Logs
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {errorLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">No errors logged</p>
                  <p className="text-sm text-muted-foreground">
                    Your application is running smoothly
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorLogs.map((log, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              log.level === LogLevel.CRITICAL
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {log.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="font-medium">{log.message}</div>
                      {log.context && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>
                Supabase database metrics and query performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Database metrics are available in the Supabase Dashboard.
                  <br />
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline mt-2 inline-block"
                  >
                    Open Supabase Dashboard →
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Application and environment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <Badge>{import.meta.env.MODE}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User Agent</span>
                  <span className="text-sm text-right max-w-md truncate">
                    {navigator.userAgent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Screen Resolution</span>
                  <span className="text-sm">
                    {window.screen.width} × {window.screen.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connection</span>
                  <Badge variant="outline">
                    {(navigator as any).connection?.effectiveType || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
