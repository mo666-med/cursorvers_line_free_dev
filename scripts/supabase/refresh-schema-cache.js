#!/usr/bin/env node
/**
 * Supabaseスキーマキャッシュをリフレッシュするスクリプト
 * 
 * 使用方法:
 *   node scripts/supabase/refresh-schema-cache.js
 */

import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません');
  console.error('');
  console.error('以下の環境変数を設定してください:');
  console.error('  export SUPABASE_URL="https://haaxgwyimoqzzxzdaeep.supabase.co"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

async function refreshSchemaCache() {
  try {
    console.log('## 🔄 Supabaseスキーマキャッシュリフレッシュ');
    console.log('');
    
    // PostgREST APIは直接NOTIFYコマンドを実行できないため、
    // ユーザーにSupabase DashboardのSQL Editorを使用するよう案内します
    
    console.log('⚠️  PostgREST APIは直接NOTIFYコマンドを実行できません');
    console.log('');
    console.log('以下の方法でスキーマキャッシュをリフレッシュしてください:');
    console.log('');
    console.log('### 方法1: Supabase DashboardのSQL Editor（推奨）');
    console.log('');
    console.log('1. ブラウザで以下を開く:');
    console.log(`   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new`);
    console.log('');
    console.log('2. 以下のSQLを実行:');
    console.log('   NOTIFY pgrst, \'reload schema\';');
    console.log('');
    console.log('3. 数回実行（5-10回推奨）');
    console.log('');
    console.log('### 方法2: Supabase CLI');
    console.log('');
    console.log('   supabase db execute "NOTIFY pgrst, \'reload schema\';"');
    console.log('');
    console.log('### 方法3: 直接PostgreSQL接続');
    console.log('');
    console.log('   psql "$DATABASE_URL" -c "NOTIFY pgrst, \'reload schema\';"');
    console.log('');
    console.log('### 注意事項');
    console.log('');
    console.log('- スキーマキャッシュの更新には数分かかる場合があります');
    console.log('- 複数回実行することで、確実にキャッシュを更新できます');
    console.log('- 更新後、ワークフローを再実行して確認してください');
    console.log('');
    
    return {
      success: false,
      message: 'PostgREST APIは直接NOTIFYコマンドを実行できません。Supabase DashboardのSQL Editorを使用してください。',
    };
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  const result = await refreshSchemaCache();
  
  if (result.success) {
    console.log('✅ スキーマキャッシュがリフレッシュされました');
  } else {
    console.log('ℹ️  手動でスキーマキャッシュをリフレッシュしてください');
    console.log('   上記の手順に従って、Supabase DashboardのSQL Editorから実行してください');
  }
}

main().catch((error) => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});
