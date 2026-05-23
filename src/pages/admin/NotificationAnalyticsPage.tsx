import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  MousePointerClick,
  Award,
  Globe,
  Calendar,
} from 'lucide-react';
import {
  getTemplateAnalytics,
  getLanguagePerformance,
  getEngagementTrends,
  getMostEffectiveTemplates,
  type TemplateAnalytics,
  type LanguagePerformance,
  type EngagementTrend,
} from '@/db/notifications';
import { toast } from 'sonner';

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function NotificationAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [templateAnalytics, setTemplateAnalytics] = useState<TemplateAnalytics[]>([]);
  const [languagePerformance, setLanguagePerformance] = useState<LanguagePerformance[]>([]);
  const [engagementTrends, setEngagementTrends] = useState<EngagementTrend[]>([]);
  const [mostEffective, setMostEffective] = useState<TemplateAnalytics[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      const [templates, languages, trends, effective] = await Promise.all([
        getTemplateAnalytics(startDate, endDate),
        getLanguagePerformance(startDate, endDate),
        getEngagementTrends(startDate, endDate, 'day'),
        getMostEffectiveTemplates(startDate, endDate, 5),
      ]);

      setTemplateAnalytics(templates);
      setLanguagePerformance(languages);
      setEngagementTrends(trends);
      setMostEffective(effective);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load notification analytics');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (): { startDate?: Date; endDate?: Date } => {
    if (dateRange === 'all') return {};

    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return { startDate, endDate };
  };

  const getTotalStats = () => {
    const total = templateAnalytics.reduce(
      (acc, t) => ({
        sent: acc.sent + t.total_sent,
        opened: acc.opened + t.total_opened,
        clicked: acc.clicked + t.total_clicked,
      }),
      { sent: 0, opened: 0, clicked: 0 }
    );

    return {
      ...total,
      openRate: total.sent > 0 ? (total.opened / total.sent) * 100 : 0,
      clickRate: total.sent > 0 ? (total.clicked / total.sent) * 100 : 0,
    };
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notification Analytics</h1>
          <p className="text-muted-foreground">
            Track template performance and user engagement metrics
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Notifications delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(totalStats.openRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalStats.opened} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(totalStats.clickRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalStats.clicked} clicked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateAnalytics.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active templates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Template Performance</TabsTrigger>
          <TabsTrigger value="languages">Language Comparison</TabsTrigger>
          <TabsTrigger value="trends">Engagement Trends</TabsTrigger>
          <TabsTrigger value="effective">Most Effective</TabsTrigger>
        </TabsList>

        {/* Template Performance */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Metrics</CardTitle>
              <CardDescription>
                Detailed analytics for each notification template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templateAnalytics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for the selected period
                  </div>
                ) : (
                  templateAnalytics.map((template) => (
                    <div
                      key={template.template_id}
                      className="flex flex-col gap-2 p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {template.title_template}
                            </h3>
                            <Badge variant="outline">{template.language}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {template.template_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-bold">{template.total_sent}</div>
                          <p className="text-xs text-muted-foreground">sent</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Open Rate</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatPercentage(template.open_rate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Click Rate</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatPercentage(template.click_rate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CTR</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {formatPercentage(template.click_through_rate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Comparison */}
        <TabsContent value="languages" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
                <CardDescription>
                  Notifications sent by language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={languagePerformance}
                      dataKey="total_sent"
                      nameKey="language"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.language}: ${entry.total_sent}`}
                    >
                      {languagePerformance.map((entry, index) => (
                        <Cell key={entry.language} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language Performance</CardTitle>
                <CardDescription>
                  Open and click rates by language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={languagePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="language" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPercentage(Number(value))} />
                    <Legend />
                    <Bar dataKey="open_rate" name="Open Rate" fill="#3b82f6" />
                    <Bar dataKey="click_rate" name="Click Rate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>
                Daily notification engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_sent"
                    name="Sent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_opened"
                    name="Opened"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_clicked"
                    name="Clicked"
                    stroke="#f59e0b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Most Effective */}
        <TabsContent value="effective" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Most Effective Templates
              </CardTitle>
              <CardDescription>
                Top performing templates based on engagement score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mostEffective.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available for the selected period
                  </div>
                ) : (
                  mostEffective.map((template, index) => (
                    <div
                      key={template.template_id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {template.title_template}
                          </h3>
                          <Badge variant="outline">{template.language}</Badge>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {template.total_sent} sent
                          </span>
                          <span className="text-blue-600">
                            {formatPercentage(template.open_rate)} open
                          </span>
                          <span className="text-green-600">
                            {formatPercentage(template.click_rate)} click
                          </span>
                        </div>
                      </div>
                      {template.open_rate > 50 ? (
                        <TrendingUp className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
