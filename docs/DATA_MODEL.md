# Data Model – Cursorvers LINE Funnel

## Google Sheets: `line_members`
| 列名 | 型 | 説明 |
|------|----|------|
| line_user_hash | TEXT | HASH_SALT入りSHA-256の先頭16桁。個人を特定せずJOINキーとして使用。 |
| display_name | TEXT | LINEプロフィール名（取得可能な場合）。 |
| segment | TEXT | 配信セグメント（例: `note_reader`, `webinar_attendee`）。 |
| registered_at | ISO8601 | 友だち追加日時。 |
| last_active_at | ISO8601 | 最終アクティビティ。 |
| conversion_status | TEXT | `trial`, `paid`, `lost` などのコンバージョン段階。 |
| source_article | TEXT | 参照元note記事URL、UTMパラメータ等。 |
| metadata | JSON | 任意メタ情報（キャンペーンIDなど）。 |

> **更新方法**: GitHub Actions (`line-event.yml`) または Manus CLI を通じてApps Script/Sheets APIを呼び出し。Service Account鍵はGitHub Secretsで管理。

## Supabase: `progress_events`
- 目的: GitHub Actions/Manusの進捗イベントを永続化し、監査・可視化に利用。
- スキーマ: `database/migrations/0001_init_tables.sql` を参照。
- 典型データ:
  ```json
  {
    "task_id": "task-123",
    "event_type": "step_succeeded",
    "step_id": "s1",
    "status": "success",
    "payload": {"latency_ms": 1200},
    "created_at": "2025-11-01T12:34:56Z"
  }
  ```

## Supabase: `budget_snapshots`
- 目的: `economic-circuit-breaker.yml` の実行結果を保存し、予算推移を可視化。
- スキーマ: `database/migrations/0001_init_tables.sql`。
- 典型データ:
  ```json
  {
    "total_cost": 42.50,
    "budget_usd": 50.0,
    "consumption_rate": 0.85,
    "status": "WARNING",
    "captured_at": "2025-11-01T13:00:00Z"
  }
  ```

## 将来拡張
- `conversion_events` テーブルを追加し、40%有料化指標をSupabaseで直接集計。
- SheetsからSupabaseへの定期同期（GitHub Actions cron）を検討。 |
