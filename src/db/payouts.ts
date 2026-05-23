import { supabase } from './supabase';

export interface PayoutRequest {
  id: string;
  seller_id: string;
  store_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_method: 'bank_transfer' | 'upi' | 'paypal' | 'other';
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  account_holder_name?: string;
  notes?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutTransaction {
  id: string;
  payout_request_id: string;
  seller_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  transaction_date: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
}

export interface PayoutSummary {
  total_earnings: number;
  total_payouts: number;
  pending_payouts: number;
  available_balance: number;
  locked_balance: number;
}

export interface SellerOrderPayoutStatus {
  order_id: string;
  order_number: string;
  total_amount: number;
  order_status: string;
  delivered_at: string;
  return_period_ends_at: string | null;
  payout_status: string | null;
  is_eligible_for_payout: boolean;
  days_until_eligible: number;
}

export interface BatchPayout {
  id: string;
  batch_type: 'approval' | 'payment';
  total_amount: number;
  request_count: number;
  processed_by: string;
  admin_notes?: string;
  created_at: string;
}

export interface PayoutAnalyticsSummary {
  total_payouts_amount: number;
  total_payouts_count: number;
  avg_payout_amount: number;
  total_pending_amount: number;
  total_pending_count: number;
  total_approved_amount: number;
  total_approved_count: number;
  total_completed_amount: number;
  total_completed_count: number;
  avg_processing_time_days: number;
}

export interface MonthlyPayoutTrend {
  month: string;
  total_amount: number;
  request_count: number;
  avg_amount: number;
}

export interface TopSellerPayout {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  total_payouts: number;
  payout_count: number;
  avg_payout: number;
}

export interface PaymentMethodDistribution {
  payment_method: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface PendingPayoutAging {
  request_id: string;
  seller_name: string;
  seller_email: string;
  store_name: string;
  amount: number;
  status: string;
  days_pending: number;
  created_at: string;
}

export interface PayoutConversionMetrics {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  completed_count: number;
  approval_rate: number;
  completion_rate: number;
  avg_processing_days: number;
}

// Get seller's payout summary
export async function getSellerPayoutSummary(): Promise<PayoutSummary | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_seller_payout_summary', {
      seller_user_id: user.id,
    });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get payout summary:', error);
    return null;
  }
}

// Get seller's available balance
export async function getSellerAvailableBalance(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('get_seller_available_balance', {
      seller_user_id: user.id,
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Failed to get available balance:', error);
    return 0;
  }
}

// Create a payout request
export async function createPayoutRequest(
  storeId: string,
  amount: number,
  paymentMethod: PayoutRequest['payment_method'],
  paymentDetails: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    accountHolderName?: string;
  },
  notes?: string
): Promise<PayoutRequest | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payout_requests')
      .insert({
        seller_id: user.id,
        store_id: storeId,
        amount,
        payment_method: paymentMethod,
        bank_name: paymentDetails.bankName,
        account_number: paymentDetails.accountNumber,
        ifsc_code: paymentDetails.ifscCode,
        upi_id: paymentDetails.upiId,
        account_holder_name: paymentDetails.accountHolderName,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create payout request:', error);
    return null;
  }
}

// Get payout requests for seller
export async function getSellerPayoutRequests(): Promise<PayoutRequest[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get payout requests:', error);
    return [];
  }
}

// Get all payout requests (admin)
export async function getAllPayoutRequests(status?: PayoutRequest['status']): Promise<(PayoutRequest & { store: any; seller: any })[]> {
  try {
    let query = supabase
      .from('payout_requests')
      .select(`
        *,
        store:stores(id, name, seller_id),
        seller:profiles!payout_requests_seller_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get all payout requests:', error);
    return [];
  }
}

// Update payout request status (admin)
export async function updatePayoutRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string,
  rejectedReason?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    if (status === 'rejected' && rejectedReason) {
      updateData.rejected_reason = rejectedReason;
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('payout_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update payout request status:', error);
    return false;
  }
}

// Complete payout (admin marks as paid)
export async function completePayoutRequest(
  requestId: string,
  transactionId: string,
  notes?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the payout request
    const { data: request, error: fetchError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update payout request to completed
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Create payout transaction record
    const { error: transactionError } = await supabase
      .from('payout_transactions')
      .insert({
        payout_request_id: requestId,
        seller_id: request.seller_id,
        amount: request.amount,
        payment_method: request.payment_method,
        transaction_id: transactionId,
        processed_by: user.id,
        notes,
      });

    if (transactionError) throw transactionError;

    return true;
  } catch (error) {
    console.error('Failed to complete payout:', error);
    return false;
  }
}

// Get payout transactions for seller
export async function getSellerPayoutTransactions(): Promise<PayoutTransaction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payout_transactions')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get payout transactions:', error);
    return [];
  }
}

// Get all payout transactions (admin)
export async function getAllPayoutTransactions(): Promise<(PayoutTransaction & { seller: any })[]> {
  try {
    const { data, error } = await supabase
      .from('payout_transactions')
      .select(`
        *,
        seller:profiles!payout_transactions_seller_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get all payout transactions:', error);
    return [];
  }
}

// Cancel payout request (seller, only pending)
export async function cancelPayoutRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payout_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to cancel payout request:', error);
    return false;
  }
}

// Batch approve payout requests (admin)
export async function batchApprovePayouts(
  requestIds: string[],
  adminNotes?: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('batch_approve_payout_requests', {
      request_ids: requestIds,
      admin_user_id: user.id,
      notes: adminNotes || null,
    });

    if (error) throw error;
    return data; // Returns batch_id
  } catch (error) {
    console.error('Failed to batch approve payouts:', error);
    return null;
  }
}

// Batch complete payout requests (admin)
export async function batchCompletePayouts(
  requestIds: string[],
  transactionPrefix: string,
  notes?: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('batch_complete_payout_requests', {
      request_ids: requestIds,
      admin_user_id: user.id,
      transaction_prefix: transactionPrefix,
      notes: notes || null,
    });

    if (error) throw error;
    return data; // Returns batch_id
  } catch (error) {
    console.error('Failed to batch complete payouts:', error);
    return null;
  }
}

// Get batch payout history (admin)
export async function getBatchPayouts(): Promise<(BatchPayout & { processor: any })[]> {
  try {
    const { data, error } = await supabase
      .from('batch_payouts')
      .select(`
        *,
        processor:profiles!batch_payouts_processed_by_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get batch payouts:', error);
    return [];
  }
}

// Get payouts by batch ID
export async function getPayoutsByBatchId(batchId: string): Promise<(PayoutRequest & { store: any; seller: any })[]> {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        store:stores(id, name, seller_id),
        seller:profiles!payout_requests_seller_id_fkey(id, full_name, email)
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get payouts by batch:', error);
    return [];
  }
}

// Generate CSV export for payout requests
export function generatePayoutCSV(payouts: (PayoutRequest & { store?: any; seller?: any })[]): string {
  const headers = [
    'Request ID',
    'Date',
    'Seller Name',
    'Seller Email',
    'Store Name',
    'Amount',
    'Payment Method',
    'Status',
    'Bank Name',
    'Account Number',
    'IFSC Code',
    'UPI ID',
    'Account Holder',
    'Transaction ID',
    'Approved At',
    'Paid At',
    'Notes',
    'Admin Notes',
  ];

  const rows = payouts.map(p => [
    p.id,
    new Date(p.created_at).toLocaleDateString(),
    p.seller?.full_name || '',
    p.seller?.email || '',
    p.store?.name || '',
    p.amount.toString(),
    p.payment_method,
    p.status,
    p.bank_name || '',
    p.account_number || '',
    p.ifsc_code || '',
    p.upi_id || '',
    p.account_holder_name || '',
    p.transaction_id || '',
    p.approved_at ? new Date(p.approved_at).toLocaleDateString() : '',
    p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '',
    p.notes || '',
    p.admin_notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Download CSV file
export function downloadPayoutCSV(payouts: (PayoutRequest & { store?: any; seller?: any })[], filename: string = 'payouts.csv'): void {
  const csv = generatePayoutCSV(payouts);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Get payout analytics summary
export async function getPayoutAnalyticsSummary(): Promise<PayoutAnalyticsSummary | null> {
  try {
    const { data, error } = await supabase.rpc('get_payout_analytics_summary');

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get payout analytics summary:', error);
    return null;
  }
}

// Get monthly payout trends
export async function getMonthlyPayoutTrends(monthsBack: number = 12): Promise<MonthlyPayoutTrend[]> {
  try {
    const { data, error } = await supabase.rpc('get_monthly_payout_trends', {
      months_back: monthsBack,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get monthly payout trends:', error);
    return [];
  }
}

// Get top sellers by payouts
export async function getTopSellersByPayouts(limit: number = 10): Promise<TopSellerPayout[]> {
  try {
    const { data, error } = await supabase.rpc('get_top_sellers_by_payouts', {
      limit_count: limit,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get top sellers by payouts:', error);
    return [];
  }
}

// Get payment method distribution
export async function getPaymentMethodDistribution(): Promise<PaymentMethodDistribution[]> {
  try {
    const { data, error } = await supabase.rpc('get_payment_method_distribution');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get payment method distribution:', error);
    return [];
  }
}

// Get pending payout aging
export async function getPendingPayoutAging(): Promise<PendingPayoutAging[]> {
  try {
    const { data, error } = await supabase.rpc('get_pending_payout_aging');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get pending payout aging:', error);
    return [];
  }
}

// Get payout conversion metrics
export async function getPayoutConversionMetrics(): Promise<PayoutConversionMetrics | null> {
  try {
    const { data, error } = await supabase.rpc('get_payout_conversion_metrics');

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get payout conversion metrics:', error);
    return null;
  }
}

// Get all sellers who have received payouts (for filtering)
export async function getAllPayoutSellers(): Promise<{ id: string; full_name: string; email: string }[]> {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('seller_id, seller:profiles!payout_requests_seller_id_fkey(id, full_name, email)')
      .not('seller', 'is', null);

    if (error) throw error;

    // Deduplicate sellers
    const uniqueSellers = new Map();
    data?.forEach((item: any) => {
      if (item.seller && !uniqueSellers.has(item.seller.id)) {
        uniqueSellers.set(item.seller.id, item.seller);
      }
    });

    return Array.from(uniqueSellers.values());
  } catch (error) {
    console.error('Failed to get payout sellers:', error);
    return [];
  }
}

// Get seller orders with payout eligibility status
export async function getSellerOrdersWithPayoutStatus(): Promise<SellerOrderPayoutStatus[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_seller_orders_with_payout_status', {
      seller_user_id: user.id,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get seller orders with payout status:', error);
    return [];
  }
}

// Update payout eligibility for all orders (admin function)
export async function updatePayoutEligibility(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('update_payout_eligibility');

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Failed to update payout eligibility:', error);
    return 0;
  }
}
