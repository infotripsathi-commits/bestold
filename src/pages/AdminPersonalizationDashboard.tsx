import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Eye, MousePointer, Heart, TrendingUp, Settings, Search } from 'lucide-react';
import {
  getPersonalizationStats,
  getPreferenceDistribution,
  getTrendingCombinations,
  getEffectivenessMetrics,
  getPersonalizationConfig,
  updatePersonalizationConfig,
  getUserPreferenceProfile,
  type PersonalizationOverviewStats,
  type PreferenceDistribution,
  type TrendingCombination,
  type EffectivenessMetric,
  type PersonalizationConfig,
  type UserPreferenceProfile
} from '@/db/api';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminPersonalizationDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PersonalizationOverviewStats | null>(null);
  const [distribution, setDistribution] = useState<PreferenceDistribution[]>([]);
  const [trending, setTrending] = useState<TrendingCombination[]>([]);
  const [metrics, setMetrics] = useState<EffectivenessMetric[]>([]);
  const [config, setConfig] = useState<PersonalizationConfig[]>([]);
  const [configEdits, setConfigEdits] = useState<Record<string, number>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [userSearchId, setUserSearchId] = useState('');
  const [userProfile, setUserProfile] = useState<UserPreferenceProfile[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [user, profile, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, distData, trendData, metricsData, configData] = await Promise.all([
        getPersonalizationStats(),
        getPreferenceDistribution('30 days'),
        getTrendingCombinations('7 days', 2),
        getEffectivenessMetrics('30 days'),
        getPersonalizationConfig()
      ]);

      setStats(statsData);
      setDistribution(distData);
      setTrending(trendData);
      setMetrics(metricsData);
      setConfig(configData);

      // Initialize config edits
      const edits: Record<string, number> = {};
      configData.forEach(c => {
        edits[c.config_key] = c.config_value;
      });
      setConfigEdits(edits);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setConfigEdits(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSaveConfig = async () => {
    if (!user) return;

    try {
      setSavingConfig(true);
      const updates = Object.entries(configEdits).filter(([key, value]) => {
        const original = config.find(c => c.config_key === key);
        return original && original.config_value !== value;
      });

      for (const [key, value] of updates) {
        await updatePersonalizationConfig(key, value, user.id);
      }

      toast.success('Configuration updated successfully');
      await loadDashboardData();
    } catch (error: any) {
      console.error('Failed to save config:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSearchUser = async () => {
    if (!userSearchId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setSearchingUser(true);
      const profile = await getUserPreferenceProfile(userSearchId.trim());
      setUserProfile(profile);
      if (profile.length === 0) {
        toast.info('No preference data found for this user');
      }
    } catch (error) {
      console.error('Failed to search user:', error);
      toast.error('Failed to load user profile');
    } finally {
      setSearchingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalization Dashboard</h1>
        <p className="text-muted-foreground">Monitor and configure the personalization system</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="users">User Profiles</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users Tracked</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_users_tracked || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.active_users_7d || 0} active (7d)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.avg_views_per_user?.toFixed(1) || 0} avg per user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suggestion Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_clicks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overall_ctr?.toFixed(2) || 0}% CTR
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_favorites || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Strong interest signals
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Effectiveness Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Effectiveness Metrics (Last 30 Days)</CardTitle>
              <CardDescription>Key performance indicators for personalization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.metric_name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{metric.metric_description}</p>
                      <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
                    </div>
                    <div className="text-2xl font-bold">{metric.metric_value.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Preference Distribution</CardTitle>
              <CardDescription>View counts by category (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={distribution.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="out_category_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="out_view_count" fill="#8884d8" name="Views" />
                  <Bar dataKey="out_unique_users" fill="#82ca9d" name="Unique Users" />
                  <Bar dataKey="out_click_count" fill="#ffc658" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Categories by Views</CardTitle>
              <CardDescription>Detailed breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Unique Users</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Favorites</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distribution.map((item) => (
                      <TableRow key={item.out_category_id}>
                        <TableCell className="font-medium">{item.out_category_name}</TableCell>
                        <TableCell className="text-right">{item.out_view_count}</TableCell>
                        <TableCell className="text-right">{item.out_unique_users}</TableCell>
                        <TableCell className="text-right">{item.out_click_count}</TableCell>
                        <TableCell className="text-right">{item.out_favorite_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Category Combinations
              </CardTitle>
              <CardDescription>Categories frequently viewed together (last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categories</TableHead>
                      <TableHead className="text-right">Occurrences</TableHead>
                      <TableHead className="text-right">Unique Users</TableHead>
                      <TableHead className="text-right">Avg Views/Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trending.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.category_names.join(' + ')}
                        </TableCell>
                        <TableCell className="text-right">{item.occurrence_count}</TableCell>
                        <TableCell className="text-right">{item.unique_users}</TableCell>
                        <TableCell className="text-right">{item.avg_session_views.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                    {trending.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No trending combinations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Personalization Configuration
              </CardTitle>
              <CardDescription>Adjust scoring weights and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Scoring Weights</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {config.filter(c => c.config_key.includes('weight')).map((item) => (
                      <div key={item.config_key} className="space-y-2">
                        <Label htmlFor={item.config_key}>{item.description}</Label>
                        <Input
                          id={item.config_key}
                          type="number"
                          step="0.1"
                          min="0"
                          value={configEdits[item.config_key] || 0}
                          onChange={(e) => handleConfigChange(item.config_key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Time Decay Parameters</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    {config.filter(c => c.config_key.includes('time_decay')).map((item) => (
                      <div key={item.config_key} className="space-y-2">
                        <Label htmlFor={item.config_key}>{item.description}</Label>
                        <Input
                          id={item.config_key}
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={configEdits[item.config_key] || 0}
                          onChange={(e) => handleConfigChange(item.config_key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Limits</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {config.filter(c => c.config_key.includes('limit')).map((item) => (
                      <div key={item.config_key} className="space-y-2">
                        <Label htmlFor={item.config_key}>{item.description}</Label>
                        <Input
                          id={item.config_key}
                          type="number"
                          step="1"
                          min="1"
                          max="50"
                          value={configEdits[item.config_key] || 0}
                          onChange={(e) => handleConfigChange(item.config_key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={savingConfig}>
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Profiles Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                User Preference Profile
              </CardTitle>
              <CardDescription>Search and view individual user preferences for debugging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user ID (UUID)"
                  value={userSearchId}
                  onChange={(e) => setUserSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <Button onClick={handleSearchUser} disabled={searchingUser}>
                  {searchingUser ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {userProfile.length > 0 && (
                <div className="w-full max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Subcategory</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Favorites</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead>Last Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProfile.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.category_name || '-'}</TableCell>
                          <TableCell>{item.subcategory_name || '-'}</TableCell>
                          <TableCell className="text-right">{item.view_count}</TableCell>
                          <TableCell className="text-right">{item.favorite_count}</TableCell>
                          <TableCell className="text-right">{item.click_count}</TableCell>
                          <TableCell className="text-right">{item.preference_score.toFixed(1)}</TableCell>
                          <TableCell>
                            {item.last_activity ? new Date(item.last_activity).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
