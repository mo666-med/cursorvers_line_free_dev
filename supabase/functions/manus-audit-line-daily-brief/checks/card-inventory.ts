/**
 * カード在庫チェック
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "../../_shared/logger.ts";
import {
  CardInventory,
  CardInventoryCheckResult,
  CardTheme,
} from "../types.ts";

const log = createLogger("audit-card-inventory");

const THEMES: CardTheme[] = [
  "ai_gov",
  "tax",
  "law",
  "biz",
  "career",
  "asset",
  "general",
];
const MIN_READY_CARDS = 50;

export async function checkCardInventory(
  client: SupabaseClient,
): Promise<CardInventoryCheckResult> {
  log.info("Checking card inventory");

  // RPC関数を使用してサーバーサイドで集計（1000件制限を回避）
  const { data, error } = await client.rpc("get_card_inventory_stats");

  if (error) {
    log.error("Failed to fetch card inventory", { error: error.message });
    return {
      passed: false,
      warnings: [`Failed to fetch inventory: ${error.message}`],
      details: [],
    };
  }

  // RPC結果をinventory形式に変換
  const inventory: Record<
    CardTheme,
    { ready: number; used: number; archived: number; total: number }
  > = {
    ai_gov: { ready: 0, used: 0, archived: 0, total: 0 },
    tax: { ready: 0, used: 0, archived: 0, total: 0 },
    law: { ready: 0, used: 0, archived: 0, total: 0 },
    biz: { ready: 0, used: 0, archived: 0, total: 0 },
    career: { ready: 0, used: 0, archived: 0, total: 0 },
    asset: { ready: 0, used: 0, archived: 0, total: 0 },
    general: { ready: 0, used: 0, archived: 0, total: 0 },
  };

  for (const row of data || []) {
    const theme = row.theme as CardTheme;
    if (inventory[theme]) {
      inventory[theme].ready = Number(row.ready_count) || 0;
      inventory[theme].used = Number(row.used_count) || 0;
      inventory[theme].archived = Number(row.archived_count) || 0;
      inventory[theme].total = Number(row.total_count) || 0;
    }
  }

  const details: CardInventory[] = THEMES.map((theme) => ({
    theme,
    ready_cards: inventory[theme].ready,
    used_cards: inventory[theme].used,
    total_cards: inventory[theme].total,
  }));

  const warnings: string[] = [];
  let allPassed = true;

  for (const item of details) {
    if (item.ready_cards === 0) {
      warnings.push(`🚨 緊急: ${item.theme}テーマのreadyカードが0枚です！`);
      allPassed = false;
    } else if (item.ready_cards < MIN_READY_CARDS) {
      warnings.push(
        `⚠️ 警告: ${item.theme}テーマのreadyカードが${item.ready_cards}枚（${MIN_READY_CARDS}枚未満）`,
      );
      allPassed = false;
    }
  }

  log.info("Card inventory check completed", {
    passed: allPassed,
    warningCount: warnings.length,
  });

  return { passed: allPassed, warnings, details };
}
