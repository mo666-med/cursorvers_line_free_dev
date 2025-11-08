#!/usr/bin/env node
/**
 * Supabaseスキーマを確認するスクリプト
 * 
 * 使用方法:
 *   node scripts/supabase/check-schema.js
 *   node scripts/supabase/check-schema.js line_members
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

async function checkTable(tableName) {
  try {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    
    // テーブルの存在確認（PostgRESTのスキーマ情報を取得）
    // 注意: PostgRESTは直接スキーマ情報を取得できないため、
    // 実際にはテーブルにアクセスしてみて、エラーが返ってくるかどうかで判断します
    
    console.log(`## 🔍 テーブル確認: ${tableName}`);
    console.log('');
    
    // テーブルにアクセスしてみる（LIMIT 0で実際のデータは取得しない）
    const testUrl = `${baseUrl}/rest/v1/${tableName}?limit=0&select=*`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
      });
      
      if (response.ok) {
        console.log(`✅ テーブル "${tableName}" は存在し、アクセス可能です`);
        
        // カラム情報を取得（PostgRESTのメタデータエンドポイントを使用）
        // 注意: PostgRESTは直接カラム情報を返さないため、
        // 実際のデータを1行取得して、キーを確認します
        
        const dataUrl = `${baseUrl}/rest/v1/${tableName}?limit=1&select=*`;
        const dataResponse = await fetch(dataUrl, {
          method: 'GET',
          headers,
        });
        
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log('');
            console.log('📋 カラム一覧（サンプルデータから推測）:');
            Object.keys(data[0]).forEach((key) => {
              const value = data[0][key];
              const type = typeof value;
              console.log(`  - ${key}: ${type}`);
            });
          } else {
            console.log('');
            console.log('⚠️  テーブルは存在しますが、データがありません');
            console.log('   カラム情報を確認するには、Supabase DashboardのSQL Editorを使用してください:');
            console.log(`   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new`);
            console.log('');
            console.log('   以下のSQLを実行:');
            console.log(`   SELECT column_name, data_type, is_nullable, column_default`);
            console.log(`   FROM information_schema.columns`);
            console.log(`   WHERE table_name = '${tableName}'`);
            console.log(`   AND table_schema = 'public'`);
            console.log(`   ORDER BY ordinal_position;`);
          }
        }
        
        return {
          success: true,
          exists: true,
        };
      } else {
        const errorText = await response.text();
        console.log(`❌ テーブル "${tableName}" へのアクセスに失敗しました`);
        console.log(`   HTTPステータス: ${response.status}`);
        console.log(`   エラー: ${errorText}`);
        
        if (response.status === 404 || response.status === 406) {
          console.log('');
          console.log('⚠️  テーブルが存在しないか、PostgRESTのスキーマキャッシュが更新されていません');
          console.log('');
          console.log('対処方法:');
          console.log('1. Supabase DashboardのSQL Editorでスキーマキャッシュをリフレッシュ:');
          console.log(`   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new`);
          console.log('');
          console.log('   NOTIFY pgrst, \'reload schema\';');
          console.log('');
          console.log('2. 数分待ってから再度実行');
          console.log('');
          console.log('3. テーブルが実際に存在するか確認:');
          console.log(`   SELECT table_name FROM information_schema.tables WHERE table_name = '${tableName}' AND table_schema = 'public';`);
        }
        
        return {
          success: false,
          exists: false,
          error: errorText,
        };
      }
    } catch (fetchError) {
      console.error('❌ リクエストエラー:', fetchError.message);
      return {
        success: false,
        error: fetchError.message,
      };
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  const tableName = process.argv[2] || 'line_members';
  
  console.log('## 🔍 Supabaseスキーマ確認スクリプト');
  console.log('');
  console.log(`対象テーブル: ${tableName}`);
  console.log('');
  
  const result = await checkTable(tableName);
  
  if (result.success && result.exists) {
    console.log('');
    console.log('✅ 確認完了');
  } else {
    console.log('');
    console.log('❌ 確認に失敗しました');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});
