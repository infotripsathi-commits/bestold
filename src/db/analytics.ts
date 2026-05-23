import { supabase } from './supabase';

export interface AnalyticsSummary {
  total_views: number;
  total_buy_clicks: number;
  total_chat_clicks: number;
  total_whatsapp_clicks: number;
  total_favorites: number;
  total_shares: number;
  unique_visitors: number;
  conversion_rate: number;
}

export interface AnalyticsEvent {
  id: string;
  product_id: string;
  event_type: 'view' | 'buy_click' | 'chat_click' | 'whatsapp_click' | 'favorite_add' | 'favorite_remove' | 'share_click';
  visitor_id: string;
  user_id?: string;
  user_agent?: string;
  referrer?: string;
  created_at: string;
}

export interface ViewsOverTime {
  date: string;
  views: number;
  unique_visitors: number;
}

export interface ButtonClickMetrics {
  event_type: string;
  count: number;
}

export interface PeakHour {
  hour: number;
  count: number;
}

// Generate a visitor ID (simple fingerprint)
export function getVisitorId(): string {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

// Track an analytics event
export async function trackAnalyticsEvent(
  productId: string,
  eventType: AnalyticsEvent['event_type']
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('product_analytics')
      .insert({
        product_id: productId,
        event_type: eventType,
        visitor_id: visitorId,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });

    if (error) {
      console.error('Failed to track analytics event:', error);
    }
  } catch (error) {
    console.error('Error tracking analytics:', error);
  }
}

// Get analytics summary for seller
export async function getSellerAnalyticsSummary(
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsSummary | null> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('get_seller_analytics_summary', {
        seller_user_id: user.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return null;
  }
}

// Get views over time
export async function getViewsOverTime(
  startDate?: Date,
  endDate?: Date
): Promise<ViewsOverTime[]> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('product_analytics')
      .select(`
        created_at,
        event_type,
        visitor_id,
        products!inner(
          store_id,
          stores!inner(seller_id)
        )
      `)
      .eq('products.stores.seller_id', user.id)
      .eq('event_type', 'view')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const groupedData: { [key: string]: { views: number; visitors: Set<string> } } = {};
    
    data?.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { views: 0, visitors: new Set() };
      }
      groupedData[date].views++;
      groupedData[date].visitors.add(item.visitor_id);
    });

    return Object.entries(groupedData).map(([date, stats]) => ({
      date,
      views: stats.views,
      unique_visitors: stats.visitors.size,
    }));
  } catch (error) {
    console.error('Failed to get views over time:', error);
    return [];
  }
}

// Get button click metrics
export async function getButtonClickMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<ButtonClickMetrics[]> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('product_analytics')
      .select(`
        event_type,
        products!inner(
          store_id,
          stores!inner(seller_id)
        )
      `)
      .eq('products.stores.seller_id', user.id)
      .in('event_type', ['buy_click', 'chat_click', 'whatsapp_click', 'favorite_add', 'share_click'])
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    // Group by event type
    const groupedData: { [key: string]: number } = {};
    
    data?.forEach((item) => {
      groupedData[item.event_type] = (groupedData[item.event_type] || 0) + 1;
    });

    return Object.entries(groupedData).map(([event_type, count]) => ({
      event_type,
      count,
    }));
  } catch (error) {
    console.error('Failed to get button click metrics:', error);
    return [];
  }
}

// Get peak browsing hours
export async function getPeakBrowsingHours(
  startDate?: Date,
  endDate?: Date
): Promise<PeakHour[]> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('product_analytics')
      .select(`
        created_at,
        products!inner(
          store_id,
          stores!inner(seller_id)
        )
      `)
      .eq('products.stores.seller_id', user.id)
      .eq('event_type', 'view')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    // Group by hour
    const groupedData: { [key: number]: number } = {};
    
    data?.forEach((item) => {
      const hour = new Date(item.created_at).getHours();
      groupedData[hour] = (groupedData[hour] || 0) + 1;
    });

    // Fill in missing hours with 0
    const result: PeakHour[] = [];
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        hour,
        count: groupedData[hour] || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to get peak browsing hours:', error);
    return [];
  }
}

// Get top performing products
export async function getTopPerformingProducts(
  startDate?: Date,
  endDate?: Date,
  limit: number = 5
) {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('product_analytics')
      .select(`
        product_id,
        event_type,
        products!inner(
          id,
          title,
          price,
          images,
          store_id,
          stores!inner(seller_id)
        )
      `)
      .eq('products.stores.seller_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    // Group by product
    const productStats: { [key: string]: any } = {};
    
    data?.forEach((item: any) => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          product_id: productId,
          title: item.products.title,
          price: item.products.price,
          image: item.products.images?.[0] || '',
          views: 0,
          clicks: 0,
          favorites: 0,
        };
      }
      
      if (item.event_type === 'view') {
        productStats[productId].views++;
      } else if (['buy_click', 'chat_click', 'whatsapp_click'].includes(item.event_type)) {
        productStats[productId].clicks++;
      } else if (item.event_type === 'favorite_add') {
        productStats[productId].favorites++;
      }
    });

    // Sort by views and return top products
    return Object.values(productStats)
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get top performing products:', error);
    return [];
  }
}

// ============================================
// ORDER ANALYTICS (for franchise sellers)
// ============================================

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  revenueByDate: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  averageFulfillmentTime: number;
  orderCompletionRate: number;
  peakOrderingHours: {
    hour: number;
    count: number;
  }[];
  topSellingProducts: {
    productId: string;
    productTitle: string;
    totalOrders: number;
    totalRevenue: number;
    images: string[];
  }[];
}

export async function getOrderAnalytics(
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<OrderAnalytics> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        products (
          id,
          title,
          images
        )
      `)
      .eq('seller_id', sellerId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return getEmptyOrderAnalytics();
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);

    const statusCounts: Record<string, number> = {};
    orders.forEach((order: any) => {
      statusCounts[order.order_status] = (statusCounts[order.order_status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalOrders) * 100,
    }));

    const revenueByDateMap: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!revenueByDateMap[date]) {
        revenueByDateMap[date] = { revenue: 0, orders: 0 };
      }
      revenueByDateMap[date].revenue += order.total_amount;
      revenueByDateMap[date].orders += 1;
    });

    const revenueByDate = Object.entries(revenueByDateMap)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const deliveredOrders = orders.filter(
      (order: any) => order.order_status === 'delivered' && order.delivered_at
    );
    let averageFulfillmentTime = 0;
    if (deliveredOrders.length > 0) {
      const totalFulfillmentTime = deliveredOrders.reduce((sum: number, order: any) => {
        const created = new Date(order.created_at).getTime();
        const delivered = new Date(order.delivered_at!).getTime();
        return sum + (delivered - created);
      }, 0);
      averageFulfillmentTime = totalFulfillmentTime / deliveredOrders.length / (1000 * 60 * 60);
    }

    const nonCancelledOrders = orders.filter((order: any) => order.order_status !== 'cancelled');
    const orderCompletionRate = nonCancelledOrders.length > 0
      ? (deliveredOrders.length / nonCancelledOrders.length) * 100
      : 0;

    const hourCounts: Record<number, number> = {};
    orders.forEach((order: any) => {
      const hour = new Date(order.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakOrderingHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))
      .sort((a, b) => a.hour - b.hour);

    const productStats: Record<string, {
      title: string;
      orders: number;
      revenue: number;
      images: string[];
    }> = {};

    orders.forEach((order: any) => {
      if (order.products) {
        const productId = order.product_id;
        if (!productStats[productId]) {
          productStats[productId] = {
            title: order.products.title,
            orders: 0,
            revenue: 0,
            images: order.products.images || [],
          };
        }
        productStats[productId].orders += 1;
        productStats[productId].revenue += order.total_amount;
      }
    });

    const topSellingProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({
        productId,
        productTitle: stats.title,
        totalOrders: stats.orders,
        totalRevenue: stats.revenue,
        images: stats.images,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      ordersByStatus,
      revenueByDate,
      averageFulfillmentTime,
      orderCompletionRate,
      peakOrderingHours,
      topSellingProducts,
    };
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    throw error;
  }
}

function getEmptyOrderAnalytics(): OrderAnalytics {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    ordersByStatus: [],
    revenueByDate: [],
    averageFulfillmentTime: 0,
    orderCompletionRate: 0,
    peakOrderingHours: [],
    topSellingProducts: [],
  };
}
