-- 診断フローの状態管理用カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS diagnosis_state jsonb DEFAULT NULL;

-- diagnosis_state の構造:
-- {
--   "keyword": "病院AIリスク診断",
--   "layer": 1,
--   "answers": ["病院経営者・管理職", "規制・コンプライアンス", ...]
-- }

COMMENT ON COLUMN users.diagnosis_state IS '診断フローの進行状態（keyword, layer, answers）';

