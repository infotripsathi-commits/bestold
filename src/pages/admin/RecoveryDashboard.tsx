import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  Zap,
} from 'lucide-react';
import {
  errorRecoveryService,
  RecoveryAttempt,
  RecoveryStrategy,
} from '@/lib/errorRecovery';
import { cacheManager } from '@/lib/cache';

export default function RecoveryDashboard() {
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryAttempt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const loadData = () => {
    try {
      const history = errorRecoveryService.getRecoveryHistory();
      const recoveryStats = errorRecoveryService.getRecoveryStats();
      const cache = cacheManager.getStats();
      
      setRecoveryHistory(history);
      setStats(recoveryStats);
      setCacheStats(cache);
    } catch (error) {
      console.error('Failed to load recovery data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear recovery history?')) {
      errorRecoveryService.clearHistory();
      loadData();
    }
  };
  
  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache?')) {
      cacheManager.clear();
      loadData();
    }
  };
  
  const getStrategyIcon = (strategy: RecoveryStrategy) => {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return <RefreshCw className="h-4 w-4" />;
      case RecoveryStrategy.CACHE_FALLBACK:
        return <Activity className="h-4 w-4" />;
      case RecoveryStrategy.GRACEFUL_DEGRADATION:
        return <TrendingUp className="h-4 w-4" />;
      case RecoveryStrategy.MANUAL_INTERVENTION:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };
  
  const getStrategyColor = (strategy: RecoveryStrategy) => {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return 'default';
      case RecoveryStrategy.CACHE_FALLBACK:
        return 'secondary';
      case RecoveryStrategy.GRACEFUL_DEGRADATION:
        return 'outline';
      case RecoveryStrategy.MANUAL_INTERVENTION:
        return 'destructive';
      default:
        return 'default';
    }
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
          <h1 className="text-3xl font-bold">Error Recovery Dashboard</h1>
          <p className="text-muted-foreground">
            Automatic error recovery and self-healing system
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recoveries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All recovery attempts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate ? stats.successRate.toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.successful || 0} successful
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgDuration ? Math.round(stats.avgDuration) : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Average duration</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Interventions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Required manual fix</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recovery Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Strategies Used</CardTitle>
          <CardDescription>
            Distribution of automatic recovery strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats?.byStrategy || {}).map(([strategy, count]) => (
              <div
                key={strategy}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStrategyIcon(strategy as RecoveryStrategy)}
                  <div>
                    <div className="font-medium capitalize">
                      {strategy.replace(/_/g, ' ')}
                    </div>
                    <div className="text-2xl font-bold">{count as number}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cache Statistics</CardTitle>
              <CardDescription>Current cache status and performance</CardDescription>
            </div>
            <Button onClick={handleClearCache} variant="outline" size="sm">
              Clear Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{cacheStats?.totalEntries || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valid Entries</p>
              <p className="text-2xl font-bold text-green-600">
                {cacheStats?.validEntries || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expired Entries</p>
              <p className="text-2xl font-bold text-orange-600">
                {cacheStats?.expiredEntries || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-2xl font-bold">
                {cacheStats?.totalSize
                  ? `${(cacheStats.totalSize / 1024).toFixed(1)} KB`
                  : '0 KB'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recovery History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Recovery Attempts</CardTitle>
              <CardDescription>Last 20 automatic recovery attempts</CardDescription>
            </div>
            {recoveryHistory.length > 0 && (
              <Button onClick={handleClearHistory} variant="outline" size="sm">
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recoveryHistory.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No recovery attempts recorded. The system is running smoothly!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {recoveryHistory.slice(0, 20).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="mt-1">
                    {attempt.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStrategyColor(attempt.strategy)}>
                        {getStrategyIcon(attempt.strategy)}
                        <span className="ml-1 capitalize">
                          {attempt.strategy.replace(/_/g, ' ')}
                        </span>
                      </Badge>
                      
                      <span className="text-sm text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </span>
                      
                      <Badge variant="outline">
                        {attempt.attempts} {attempt.attempts === 1 ? 'attempt' : 'attempts'}
                      </Badge>
                      
                      <Badge variant="outline">{attempt.duration}ms</Badge>
                    </div>
                    
                    <p className="text-sm font-medium">{attempt.error.message}</p>
                    
                    {attempt.context && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          View context
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                          {JSON.stringify(attempt.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
