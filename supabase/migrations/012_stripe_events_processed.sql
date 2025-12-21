-- Stripe Webhook冪等性保証用テーブル
-- 処理済みイベントIDを記録し、重複処理を防止

CREATE TABLE IF NOT EXISTS stripe_events_processed (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_email TEXT,
  metadata JSONB
);

-- インデックス（古いイベントのクリーンアップ用）
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON stripe_events_processed (processed_at);

-- RLS: サービスロールのみ
ALTER TABLE stripe_events_processed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - stripe_events" ON stripe_events_processed
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 30日以上古いイベントを自動削除する関数
CREATE OR REPLACE FUNCTION cleanup_old_stripe_events()
RETURNS void AS $$
BEGIN
  DELETE FROM stripe_events_processed
  WHERE processed_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE stripe_events_processed IS 'Stripe Webhook冪等性保証: 処理済みイベントID記録';
