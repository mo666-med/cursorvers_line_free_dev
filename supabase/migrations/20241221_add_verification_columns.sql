-- 認証コード方式に必要なカラムを追加
-- 実行: npx supabase db push または Supabase Dashboard から手動実行

-- 認証コード（6桁英数字）
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);

-- 認証コード有効期限
ALTER TABLE members ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Discord招待送信済みフラグ
ALTER TABLE members ADD COLUMN IF NOT EXISTS discord_invite_sent BOOLEAN DEFAULT FALSE;

-- リマインダー送信回数
ALTER TABLE members ADD COLUMN IF NOT EXISTS reminder_sent_count INTEGER DEFAULT 0;

-- インデックス追加（認証コード検索用）
CREATE INDEX IF NOT EXISTS idx_members_verification_code
  ON members (verification_code)
  WHERE verification_code IS NOT NULL;

-- コメント追加
COMMENT ON COLUMN members.verification_code IS '有料会員LINE紐付け用認証コード（6桁英数字）';
COMMENT ON COLUMN members.verification_expires_at IS '認証コード有効期限（決済から14日後）';
COMMENT ON COLUMN members.discord_invite_sent IS 'Discord招待送信済みフラグ';
COMMENT ON COLUMN members.reminder_sent_count IS 'LINE登録リマインダー送信回数';
