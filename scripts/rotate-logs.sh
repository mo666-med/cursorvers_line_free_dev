#!/bin/bash
# ログローテーションスクリプト
# logs/progress/ のログをアーカイブし、90日超過分を削除

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs/progress"
ARCHIVE_DIR="$LOGS_DIR/archive"
RETENTION_DAYS=90
REPO_SIZE_WARNING_MB=100
REPO_SIZE_CRITICAL_MB=200

# 色付きログ出力
log_info() {
  echo "ℹ️  $*"
}

log_warn() {
  echo "⚠️  $*"
}

log_error() {
  echo "❌ $*" >&2
}

log_success() {
  echo "✅ $*"
}

# リポジトリサイズを確認（MB単位）
get_repo_size() {
  cd "$PROJECT_ROOT"
  git count-objects -vH | grep 'size-pack' | awk '{print $2}' | sed 's/M//' || echo "0"
}

# アーカイブディレクトリを作成
ensure_archive_dir() {
  local year_month="$1"
  local archive_path="$ARCHIVE_DIR/$year_month"
  mkdir -p "$archive_path"
  echo "$archive_path"
}

# ログファイルをアーカイブ（gzip圧縮）
archive_log() {
  local log_file="$1"
  local archive_path="$2"
  local filename=$(basename "$log_file")
  local archive_file="$archive_path/${filename}.gz"
  
  gzip -c "$log_file" > "$archive_file"
  log_info "アーカイブ: $log_file → $archive_file"
  rm "$log_file"
}

# メイン処理
main() {
  cd "$PROJECT_ROOT"
  
  log_info "ログローテーション開始"
  
  # リポジトリサイズを確認
  repo_size=$(get_repo_size)
  log_info "リポジトリサイズ: ${repo_size}MB"
  
  if [ "$(echo "$repo_size >= $REPO_SIZE_CRITICAL_MB" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
    log_warn "リポジトリサイズが ${REPO_SIZE_CRITICAL_MB}MB を超えています。アーカイブを実行します。"
  elif [ "$(echo "$repo_size >= $REPO_SIZE_WARNING_MB" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
    log_warn "リポジトリサイズが ${REPO_SIZE_WARNING_MB}MB に近づいています。"
  fi
  
  # アーカイブディレクトリが存在しない場合は作成
  mkdir -p "$ARCHIVE_DIR"
  
  # 現在の日付を取得
  current_date=$(date +%s)
  retention_seconds=$((RETENTION_DAYS * 24 * 60 * 60))
  
  # logs/progress/ のログファイルを処理
  if [ ! -d "$LOGS_DIR" ]; then
    log_warn "ログディレクトリが見つかりません: $LOGS_DIR"
    exit 0
  fi
  
  archived_count=0
  deleted_count=0
  
  while IFS= read -r -d '' log_file; do
    # ファイルの更新日時を取得
    file_mtime=$(stat -f "%m" "$log_file" 2>/dev/null || stat -c "%Y" "$log_file" 2>/dev/null || echo "0")
    
    if [ "$file_mtime" = "0" ]; then
      log_warn "ファイルの更新日時を取得できません: $log_file"
      continue
    fi
    
    # 経過日数を計算
    age_seconds=$((current_date - file_mtime))
    age_days=$((age_seconds / 86400))
    
    if [ "$age_days" -gt "$RETENTION_DAYS" ]; then
      # 90日超過: アーカイブまたは削除
      year_month=$(date -r "$file_mtime" +"%Y-%m" 2>/dev/null || date -d "@$file_mtime" +"%Y-%m" 2>/dev/null || echo "unknown")
      archive_path=$(ensure_archive_dir "$year_month")
      archive_log "$log_file" "$archive_path"
      archived_count=$((archived_count + 1))
    else
      log_info "保持: $log_file (経過日数: ${age_days}日)"
    fi
  done < <(find "$LOGS_DIR" -maxdepth 1 -type f -name "*.json" -print0 2>/dev/null || true)
  
  # 1年超過のアーカイブログを削除
  one_year_ago=$(date -v-1y +%s 2>/dev/null || date -d "1 year ago" +%s 2>/dev/null)
  
  while IFS= read -r -d '' archive_file; do
    archive_mtime=$(stat -f "%m" "$archive_file" 2>/dev/null || stat -c "%Y" "$archive_file" 2>/dev/null || echo "0")
    
    if [ "$archive_mtime" != "0" ] && [ "$archive_mtime" -lt "$one_year_ago" ]; then
      log_info "削除（1年超過）: $archive_file"
      rm "$archive_file"
      deleted_count=$((deleted_count + 1))
    fi
  done < <(find "$ARCHIVE_DIR" -type f -name "*.json.gz" -print0 2>/dev/null || true)
  
  # 空のアーカイブディレクトリを削除
  find "$ARCHIVE_DIR" -type d -empty -delete 2>/dev/null || true
  
  log_success "ログローテーション完了"
  log_info "  - アーカイブ: ${archived_count}件"
  log_info "  - 削除: ${deleted_count}件"
  log_info "  - 現在のリポジトリサイズ: ${repo_size}MB"
  
  # 変更をコミット（GitHub Actionsから実行される場合）
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    if [ "$archived_count" -gt 0 ] || [ "$deleted_count" -gt 0 ]; then
      git config user.name "github-actions[bot]"
      git config user.email "github-actions[bot]@users.noreply.github.com"
      git add "$LOGS_DIR" "$ARCHIVE_DIR" 2>/dev/null || true
      git commit -m "chore: rotate logs (archived: ${archived_count}, deleted: ${deleted_count})" || true
      git push || true
    fi
  fi
}

main "$@"
