// supabase/functions/line-webhook/lib/course-router.ts
// 診断キーワードごとのコース案内ロジック

import type { DiagnosisKeyword } from "./types.ts";
import { getFirstArticle, getRecommendationsForKeyword } from "./note-recommendations.ts";

/**
 * 診断キーワードに対する初回メッセージを生成
 */
export function buildCourseEntryMessage(keyword: DiagnosisKeyword): string {
  const firstArticle = getFirstArticle(keyword);
  const course = getRecommendationsForKeyword(keyword);
  
  const header = `【${keyword}】\n\n`;
  
  // キーワードごとの説明文
  const descriptions: Record<DiagnosisKeyword, string> = {
    "病院AIリスク診断": 
      "病院・診療所におけるAI導入のリスクと機会を診断します。経営者・CIO向けの実践的なガイダンスです。",
    "SaMDスタートアップ診断":
      "医療AI/SaMD開発における規制対応と市場参入戦略を診断します。スタートアップ・PM向けです。",
    "医療データガバナンス診断":
      "医療データの利活用とガバナンス体制を診断します。PHR事業者・医療情報システム会社向けです。",
    "臨床知アセット診断":
      "臨床医としての知識・経験をAI時代にどう活かすかを診断します。個人のキャリアと思考を守るフレームワークです。",
    "教育AI導入診断":
      "医学教育・学校教育におけるAI活用の現状と課題を診断します。教育者向けの導入ロードマップです。",
    "次世代AI実装診断":
      "生成動画AI・フィジカルAI・環境KPIなど、次世代技術への対応を診断します。先進派向けの実装戦略です。",
  };

  const description = descriptions[keyword] ?? "";
  
  let body = description + "\n\n";
  
  // まず読むべき1本を案内
  if (firstArticle) {
    body += "📚 おすすめ記事：\n";
    body += `${firstArticle.title}\n`;
    if (firstArticle.url) {
      body += `${firstArticle.url}\n`;
    }
  }
  
  // 関連記事数を案内
  if (course && course.articles.length > 1) {
    body += `\n📖 関連記事：全${course.articles.length}本`;
  }
  
  return header + body;
}

/**
 * 診断キーワードに関連する記事一覧メッセージを生成（将来用）
 */
export function buildArticleListMessage(keyword: DiagnosisKeyword): string | null {
  const course = getRecommendationsForKeyword(keyword);
  if (!course) return null;
  
  let message = `【${keyword}】関連記事一覧：\n\n`;
  
  for (let i = 0; i < Math.min(course.articles.length, 5); i++) {
    const article = course.articles[i];
    message += `${i + 1}. ${article.title}\n`;
    if (article.url) {
      message += `   ${article.url}\n`;
    }
    message += "\n";
  }
  
  if (course.articles.length > 5) {
    message += `...他${course.articles.length - 5}本`;
  }
  
  return message;
}
