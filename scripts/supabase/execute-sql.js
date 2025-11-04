#!/usr/bin/env node
/**
 * Supabaseに直接SQLを実行するスクリプト
 * 
 * 使用方法:
 *   node scripts/supabase/execute-sql.js "SELECT * FROM line_members LIMIT 5;"
 *   node scripts/supabase/execute-sql.js --file database/migrations/0001_init_tables.sql
 *   node scripts/supabase/execute-sql.js "NOTIFY pgrst, 'reload schema';"
 */

import { readFile } from 'node:fs/promises';
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

async function executeSQL(sql) {
  try {
    // Supabase Management APIを使用してSQLを実行
    // 注意: Supabase REST APIは直接SQL実行をサポートしていないため、
    // PostgRESTのRPCエンドポイントを使用するか、Management APIを使用する必要があります
    
    // 方法1: Supabase Management APIを使用（推奨）
    // ただし、これはSupabase Dashboardにログインしている必要があります
    
    // 方法2: PostgRESTのRPCを使用
    // ストアドプロシージャを作成して実行する必要があります
    
    // 方法3: 直接PostgreSQL接続を使用
    // これは最も確実ですが、データベースパスワードが必要です
    
    // ここでは、PostgRESTのRPCエンドポイントを使用する方法を実装します
    // ただし、NOTIFYコマンドなどは直接実行できないため、
    // エラーメッセージを表示して、代替方法を提示します
    
    console.log('⚠️  PostgREST APIは直接SQL実行をサポートしていません');
    console.log('');
    console.log('以下の方法を使用してください:');
    console.log('');
    console.log('1. Supabase DashboardのSQL Editorから実行（推奨）');
    console.log(`   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new`);
    console.log('');
    console.log('2. Supabase CLIを使用');
    console.log('   supabase db execute --file database/migrations/0001_init_tables.sql');
    console.log('');
    console.log('3. 直接PostgreSQL接続を使用');
    console.log('   psql "$DATABASE_URL" -c "SQL_COMMAND"');
    console.log('');
    console.log('実行したいSQL:');
    console.log('---');
    console.log(sql);
    console.log('---');
    
    // ただし、SELECTクエリの場合は、PostgRESTのREST APIを使用できます
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      console.log('');
      console.log('ℹ️  SELECTクエリの場合は、PostgRESTのREST APIを使用できます');
      console.log('   ただし、このスクリプトでは直接実行できません');
      console.log('   Supabase DashboardのSQL Editorを使用してください');
    }
    
    // NOTIFYコマンドの場合
    if (sql.trim().toUpperCase().includes('NOTIFY')) {
      console.log('');
      console.log('ℹ️  NOTIFYコマンドは、PostgREST経由では実行できません');
      console.log('   Supabase DashboardのSQL Editorから直接実行してください');
    }
    
    return {
      success: false,
      message: 'PostgREST APIは直接SQL実行をサポートしていません。Supabase DashboardのSQL Editorを使用してください。',
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
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ SQLクエリまたはファイルパスを指定してください');
    console.error('');
    console.error('使用方法:');
    console.error('  node scripts/supabase/execute-sql.js "SELECT * FROM line_members;"');
    console.error('  node scripts/supabase/execute-sql.js --file database/migrations/0001_init_tables.sql');
    process.exit(1);
  }
  
  let sql = '';
  
  if (args[0] === '--file' || args[0] === '-f') {
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ ファイルパスを指定してください');
      process.exit(1);
    }
    try {
      sql = await readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ ファイルを読み込めません: ${filePath}`);
      console.error(`   エラー: ${error.message}`);
      process.exit(1);
    }
  } else {
    sql = args.join(' ');
  }
  
  if (!sql.trim()) {
    console.error('❌ SQLクエリが空です');
    process.exit(1);
  }
  
  console.log('## 🔍 Supabase SQL実行スクリプト');
  console.log('');
  console.log('実行するSQL:');
  console.log('---');
  console.log(sql);
  console.log('---');
  console.log('');
  
  const result = await executeSQL(sql);
  
  if (result.success) {
    console.log('✅ SQLが正常に実行されました');
    if (result.data) {
      console.log('');
      console.log('結果:');
      console.log(JSON.stringify(result.data, null, 2));
    }
  } else {
    console.error('❌ SQLの実行に失敗しました');
    if (result.message) {
      console.error(`   メッセージ: ${result.message}`);
    }
    if (result.error) {
      console.error(`   エラー: ${result.error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});
