/**
 * LINE Cards Export Script - Type Definitions
 */

/** Card theme categories */
export type CardTheme =
  | "ai_gov"   // 医療AI/ヘルスケアDX
  | "tax"      // 税務・節税
  | "law"      // 法務・契約
  | "biz"      // 事業戦略・経営
  | "career"   // キャリア・働き方
  | "asset"    // 資産形成・投資
  | "tech"     // 開発・プログラミング
  | "crypto"   // 暗号資産・Web3
  | "thought"  // 考察・意見
  | "life"     // 日常・雑記
  | "general"; // その他

/** Card status in database */
export type CardStatus = "ready" | "used" | "archived";

/** Theme tag mapping */
export const THEME_TAG_MAP: Record<string, CardTheme> = {
  "#ai_gov": "ai_gov",
  "#tax": "tax",
  "#law": "law",
  "#biz": "biz",
  "#career": "career",
  "#asset": "asset",
  "#tech": "tech",
  "#crypto": "crypto",
  "#thought": "thought",
  "#life": "life",
};

/** Main extraction tag */
export const EXTRACTION_TAG = "#cv_line";

/** Extracted card from Obsidian */
export interface ExtractedCard {
  /** Card body text (tags removed) */
  body: string;
  /** Theme classification */
  theme: CardTheme;
  /** Source file path relative to vault */
  sourcePath: string;
  /** Source line number */
  sourceLine: number;
  /** Content hash for deduplication */
  contentHash: string;
}

/** Card record for database insertion */
export interface LineCardInsert {
  body: string;
  theme: CardTheme;
  source_path: string;
  source_line: number;
  content_hash: string;
  status: CardStatus;
  times_used: number;
  created_from_vault_at: string;
}

/** Existing card record from database */
export interface LineCardRecord extends LineCardInsert {
  id: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Extraction result for a single file */
export interface FileExtractionResult {
  filePath: string;
  cards: ExtractedCard[];
  errors: string[];
}

/** Overall extraction statistics */
export interface ExtractionStats {
  filesScanned: number;
  filesWithCards: number;
  totalCardsFound: number;
  newCardsInserted: number;
  duplicatesSkipped: number;
  errors: string[];
}

/** Script configuration */
export interface ExportConfig {
  vaultPath: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  dryRun: boolean;
  batchSize: number;
}
