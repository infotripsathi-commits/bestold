-- Insert default subscription plans
INSERT INTO subscription_plans (name, duration_days, price, features, status)
VALUES 
  (
    'Monthly Premium',
    30,
    299,
    jsonb_build_array(
      'Unlimited product listings',
      'Online selling capability',
      'Priority placement in search results',
      'Premium badge on store and products',
      'Order management dashboard',
      'Customer tracking information'
    ),
    'active'
  ),
  (
    'Quarterly Premium',
    90,
    799,
    jsonb_build_array(
      'Unlimited product listings',
      'Online selling capability',
      'Priority placement in search results',
      'Premium badge on store and products',
      'Order management dashboard',
      'Customer tracking information',
      'Save ₹98 compared to monthly'
    ),
    'active'
  ),
  (
    'Yearly Premium',
    365,
    2999,
    jsonb_build_array(
      'Unlimited product listings',
      'Online selling capability',
      'Priority placement in search results',
      'Premium badge on store and products',
      'Order management dashboard',
      'Customer tracking information',
      'Save ₹589 compared to monthly',
      'Best value for serious sellers'
    ),
    'active'
  )
ON CONFLICT DO NOTHING;