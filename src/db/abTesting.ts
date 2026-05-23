import { supabase } from './supabase';

export interface ABTest {
  id: string;
  product_id: string;
  seller_id: string;
  test_name: string;
  test_type: 'title' | 'description' | 'price' | 'images' | 'combined';
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  winner_variant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ABTestVariant {
  id: string;
  test_id: string;
  variant_name: string;
  is_control: boolean;
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  created_at: string;
}

export interface ABTestResults {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  total_views: number;
  total_clicks: number;
  total_favorites: number;
  conversion_rate: number;
  unique_visitors: number;
}

export interface StatisticalSignificance {
  chi_square_value: number;
  is_significant: boolean;
  confidence_level: number;
}

// Create a new A/B test with variants
export async function createABTest(
  productId: string,
  testName: string,
  testType: ABTest['test_type'],
  variants: Omit<ABTestVariant, 'id' | 'test_id' | 'created_at'>[]
): Promise<ABTest | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create the test
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .insert({
        product_id: productId,
        seller_id: user.id,
        test_name: testName,
        test_type: testType,
        status: 'draft',
      })
      .select()
      .single();

    if (testError) throw testError;

    // Create variants
    const variantsToInsert = variants.map(v => ({
      test_id: test.id,
      ...v,
    }));

    const { error: variantsError } = await supabase
      .from('ab_test_variants')
      .insert(variantsToInsert);

    if (variantsError) throw variantsError;

    return test;
  } catch (error) {
    console.error('Failed to create A/B test:', error);
    return null;
  }
}

// Get all A/B tests for the current seller
export async function getABTests(status?: ABTest['status']): Promise<ABTest[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('ab_tests')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get A/B tests:', error);
    return [];
  }
}

// Get a single A/B test with its variants
export async function getABTest(testId: string): Promise<(ABTest & { variants: ABTestVariant[] }) | null> {
  try {
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError) throw testError;

    const { data: variants, error: variantsError } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('test_id', testId)
      .order('is_control', { ascending: false });

    if (variantsError) throw variantsError;

    return {
      ...test,
      variants: variants || [],
    };
  } catch (error) {
    console.error('Failed to get A/B test:', error);
    return null;
  }
}

// Get A/B test results with statistics
export async function getABTestResults(testId: string): Promise<ABTestResults[]> {
  try {
    const { data, error } = await supabase.rpc('get_ab_test_results', {
      test_uuid: testId,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get A/B test results:', error);
    return [];
  }
}

// Calculate statistical significance between control and variant
export async function calculateStatisticalSignificance(
  controlConversions: number,
  controlViews: number,
  variantConversions: number,
  variantViews: number
): Promise<StatisticalSignificance | null> {
  try {
    const { data, error } = await supabase.rpc('calculate_chi_square', {
      control_conversions: controlConversions,
      control_views: controlViews,
      variant_conversions: variantConversions,
      variant_views: variantViews,
    });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to calculate statistical significance:', error);
    return null;
  }
}

// Update A/B test status
export async function updateABTestStatus(
  testId: string,
  status: ABTest['status'],
  winnerVariantId?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'active' && !updateData.start_date) {
      updateData.start_date = new Date().toISOString();
    }

    if (status === 'completed') {
      updateData.end_date = new Date().toISOString();
      if (winnerVariantId) {
        updateData.winner_variant_id = winnerVariantId;
      }
    }

    const { error } = await supabase
      .from('ab_tests')
      .update(updateData)
      .eq('id', testId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update A/B test status:', error);
    return false;
  }
}

// Get active A/B test for a product
export async function getActiveABTestForProduct(productId: string): Promise<(ABTest & { variants: ABTestVariant[] }) | null> {
  try {
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .single();

    if (testError || !test) return null;

    const { data: variants, error: variantsError } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('test_id', test.id);

    if (variantsError) throw variantsError;

    return {
      ...test,
      variants: variants || [],
    };
  } catch (error) {
    return null;
  }
}

// Assign a variant to a visitor (random assignment with consistent storage)
export function assignVariant(testId: string, variants: ABTestVariant[]): ABTestVariant {
  const storageKey = `ab_test_${testId}`;
  
  // Check if visitor already has an assigned variant
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const storedVariant = variants.find(v => v.id === stored);
    if (storedVariant) return storedVariant;
  }

  // Randomly assign a variant
  const randomIndex = Math.floor(Math.random() * variants.length);
  const assignedVariant = variants[randomIndex];

  // Store the assignment
  localStorage.setItem(storageKey, assignedVariant.id);

  return assignedVariant;
}

// Delete an A/B test
export async function deleteABTest(testId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ab_tests')
      .delete()
      .eq('id', testId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete A/B test:', error);
    return false;
  }
}
