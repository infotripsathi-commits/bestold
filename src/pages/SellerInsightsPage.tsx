import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  ShoppingCart,
  MessageSquare,
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  getSellerAnalyticsSummary,
  getViewsOverTime,
  getButtonClickMetrics,
  getPeakBrowsingHours,
  getTopPerformingProducts,
  type AnalyticsSummary,
  type ViewsOverTime,
  type ButtonClickMetrics,
  type PeakHour,
} from '@/db/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SellerInsightsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [viewsData, setViewsData] = useState<ViewsOverTime[]>([]);
  const [buttonMetrics, setButtonMetrics] = useState<ButtonClickMetrics[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [summaryData, viewsOverTime, clicks, hours, products] = await Promise.all([
        getSellerAnalyticsSummary(startDate, endDate),
        getViewsOverTime(startDate, endDate),
        getButtonClickMetrics(startDate, endDate),
        getPeakBrowsingHours(startDate, endDate),
        getTopPerformingProducts(startDate, endDate, 5),
      ]);

      setSummary(summaryData);
      setViewsData(viewsOverTime);
      setButtonMetrics(clicks);
      setPeakHours(hours);
      setTopProducts(products);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (type: string) => {
    const labels: { [key: string]: string } = {
      buy_click: 'Buy Now',
      chat_click: 'Chat',
      whatsapp_click: 'WhatsApp',
      favorite_add: 'Favorites',
      share_click: 'Shares',
    };
    return labels[type] || type;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${period}`;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Insights</h1>
          <p className="text-muted-foreground">
            Analyze your product performance and optimize your listings
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_views || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.unique_visitors || 0} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Buy Clicks</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_buy_clicks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.conversion_rate || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contact Clicks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary?.total_chat_clicks || 0) + (summary?.total_whatsapp_clicks || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chat + WhatsApp combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_favorites || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.total_shares || 0} shares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
          <CardDescription>Daily product views and unique visitors</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
              <Line type="monotone" dataKey="unique_visitors" stroke="#82ca9d" name="Unique Visitors" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Button Click Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Button Click Metrics</CardTitle>
            <CardDescription>User interactions with action buttons</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buttonMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_type" tickFormatter={formatEventType} />
                <YAxis />
                <Tooltip labelFormatter={formatEventType} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Browsing Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Browsing Hours</CardTitle>
            <CardDescription>When visitors view your products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={formatHour} />
                <YAxis />
                <Tooltip labelFormatter={formatHour} />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>Your most viewed products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{product.views}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{product.clicks}</div>
                      <div className="text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{product.favorites}</div>
                      <div className="text-muted-foreground">Favorites</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Track how visitors interact with your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium">Views</div>
              <div className="flex-1 bg-primary h-12 rounded flex items-center justify-center text-primary-foreground font-bold">
                {summary?.total_views || 0}
              </div>
              <div className="w-20 text-sm text-muted-foreground">100%</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium">Interactions</div>
              <div 
                className="bg-primary/80 h-12 rounded flex items-center justify-center text-primary-foreground font-bold"
                style={{
                  width: `${((((summary?.total_buy_clicks || 0) + (summary?.total_chat_clicks || 0) + (summary?.total_whatsapp_clicks || 0)) / (summary?.total_views || 1)) * 100).toFixed(0)}%`
                }}
              >
                {(summary?.total_buy_clicks || 0) + (summary?.total_chat_clicks || 0) + (summary?.total_whatsapp_clicks || 0)}
              </div>
              <div className="w-20 text-sm text-muted-foreground">
                {((((summary?.total_buy_clicks || 0) + (summary?.total_chat_clicks || 0) + (summary?.total_whatsapp_clicks || 0)) / (summary?.total_views || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium">Buy Clicks</div>
              <div 
                className="bg-primary/60 h-12 rounded flex items-center justify-center text-primary-foreground font-bold"
                style={{
                  width: `${((summary?.total_buy_clicks || 0) / (summary?.total_views || 1) * 100).toFixed(0)}%`
                }}
              >
                {summary?.total_buy_clicks || 0}
              </div>
              <div className="w-20 text-sm text-muted-foreground">
                {summary?.conversion_rate || 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
