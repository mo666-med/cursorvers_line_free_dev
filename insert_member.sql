-- masa_stage1@yahoo.co.jp の顧客データを登録
INSERT INTO members (
  email,
  name,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  subscription_status,
  tier,
  period_end,
  opt_in_email,
  created_at,
  updated_at
) VALUES (
  'masa_stage1@yahoo.co.jp',
  '大田原 正幸',
  'cus_TZCzVM1WKDbrkj',
  'sub_1Sc4ZzHHe8GabhVIDRsKyCfQ',
  'active',
  'active',
  'library',
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  name = EXCLUDED.name,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  status = EXCLUDED.status,
  subscription_status = EXCLUDED.subscription_status,
  tier = EXCLUDED.tier,
  opt_in_email = EXCLUDED.opt_in_email,
  updated_at = NOW();
