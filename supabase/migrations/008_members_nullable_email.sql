-- Allow nullable email for free/LINE leads while keeping uniqueness
ALTER TABLE members ALTER COLUMN email DROP NOT NULL;

-- Ensure line_user_id is unique when provided (multiple NULLs allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_members_line_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_members_line_user_id_unique
      ON members(line_user_id);
  END IF;
END;
$$;

-- Update comment to reflect free users are included
COMMENT ON TABLE members IS 'Library/Master 有料＋無料（LINE）会員の連携情報（メール/LINE/Stripe）。メールなしの無料登録も許容。';

