import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getABTest,
  getABTestResults,
  calculateStatisticalSignificance,
  updateABTestStatus,
  type ABTest,
  type ABTestVariant,
  type ABTestResults,
} from '@/db/abTesting';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ABTestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<(ABTest & { variants: ABTestVariant[] }) | null>(null);
  const [results, setResults] = useState<ABTestResults[]>([]);
  const [significance, setSignificance] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [testData, resultsData] = await Promise.all([
        getABTest(id),
        getABTestResults(id),
      ]);

      setTest(testData);
      setResults(resultsData);

      // Calculate statistical significance if we have control and variant data
      if (resultsData.length >= 2) {
        const control = resultsData.find(r => r.is_control);
        const variant = resultsData.find(r => !r.is_control);

        if (control && variant) {
          const controlConversions = Math.round((control.conversion_rate / 100) * control.total_views);
          const variantConversions = Math.round((variant.conversion_rate / 100) * variant.total_views);

          const sig = await calculateStatisticalSignificance(
            controlConversions,
            control.total_views,
            variantConversions,
            variant.total_views
          );

          setSignificance(sig);
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareWinner = async (variantId: string) => {
    if (!id) return;

    const success = await updateABTestStatus(id, 'completed', variantId);
    if (success) {
      toast.success('Winner declared and test completed');
      loadResults();
    } else {
      toast.error('Failed to declare winner');
    }
  };

  const getWinner = () => {
    if (results.length < 2) return null;
    return results.reduce((prev, current) =>
      current.conversion_rate > prev.conversion_rate ? current : prev
    );
  };

  const winner = getWinner();

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-64 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
        <p className="text-muted-foreground mb-4">The A/B test you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/seller/ab-tests">Back to Tests</Link>
        </Button>
      </div>
    );
  }

  const chartData = results.map(r => ({
    name: r.variant_name,
    Views: r.total_views,
    Clicks: r.total_clicks,
    Favorites: r.total_favorites,
    'Conversion Rate': r.conversion_rate,
  }));

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/seller/ab-tests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Link>
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{test.test_name}</h1>
          <Badge variant={test.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {test.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Testing: {test.test_type} • Started {test.start_date ? new Date(test.start_date).toLocaleDateString() : 'Not started'}
        </p>
      </div>

      {/* Statistical Significance Card */}
      {significance && results.length >= 2 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Statistical Significance</CardTitle>
            <CardDescription>Confidence in the test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {significance.is_significant ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-lg">
                      Results are statistically significant
                    </p>
                    <p className="text-muted-foreground">
                      Confidence level: {significance.confidence_level}% (χ² = {significance.chi_square_value.toFixed(2)})
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-lg">
                      Not enough data for statistical significance
                    </p>
                    <p className="text-muted-foreground">
                      Continue running the test to gather more data (χ² = {significance.chi_square_value.toFixed(2)}, need &gt; 3.84)
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {results.map(result => {
          const isWinner = winner?.variant_id === result.variant_id;
          const control = results.find(r => r.is_control);
          const improvement = control && !result.is_control
            ? ((result.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100
            : 0;

          return (
            <Card key={result.variant_id} className={isWinner ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {result.variant_name}
                      {result.is_control && <Badge variant="outline">Control</Badge>}
                      {isWinner && <Badge>Winner</Badge>}
                    </CardTitle>
                  </div>
                  {!result.is_control && improvement !== 0 && (
                    <div className={`flex items-center gap-1 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {improvement > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-semibold">{Math.abs(improvement).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">{result.total_views}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-2xl font-bold">{result.unique_visitors}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{result.total_clicks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                    <p className="text-2xl font-bold">{result.total_favorites}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-3xl font-bold text-primary">{result.conversion_rate}%</p>
                  </div>
                </div>
                {test.status === 'active' && !result.is_control && isWinner && significance?.is_significant && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleDeclareWinner(result.variant_id)}
                  >
                    Declare Winner & Complete Test
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>Visual comparison of variant metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Views" fill="#8884d8" />
              <Bar dataKey="Clicks" fill="#82ca9d" />
              <Bar dataKey="Favorites" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Variant Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Variant Details</CardTitle>
          <CardDescription>What's being tested in each variant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {test.variants.map(variant => (
              <div key={variant.id} className="border-b pb-6 last:border-0">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {variant.variant_name}
                  {variant.is_control && <Badge variant="outline">Control</Badge>}
                </h3>
                <div className="space-y-2 text-sm">
                  {variant.title && (
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <p className="font-medium">{variant.title}</p>
                    </div>
                  )}
                  {variant.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <p className="font-medium">{variant.description}</p>
                    </div>
                  )}
                  {variant.price && (
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium">₹{variant.price.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
