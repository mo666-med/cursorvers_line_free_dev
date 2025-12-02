// supabase/functions/line-webhook/lib/diagnosis-flow.ts
// 診断フローの定義（4階層の質問ツリー）

import type { DiagnosisKeyword } from "./types.ts";
import { DISCORD_INVITE_URL } from "./constants.ts";

// 診断状態の型定義
export interface DiagnosisState {
  keyword: DiagnosisKeyword;
  layer: number;
  answers: string[];
}

// 質問の型定義
export interface DiagnosisQuestion {
  text: string;
  options: string[];
}


// =======================
// 病院AIリスク診断フロー
// =======================

const HOSPITAL_FLOW = {
  // レイヤー1: 立場（パーソナライズ感のため）
  layer1: {
    text: "あなたの立場を教えてください",
    options: [
      "病院経営者・管理職",
      "臨床医・医療従事者",
      "IT・システム担当",
      "事務・総務担当",
    ],
  },

  // レイヤー2: 関心領域（★結論を決定する主軸）
  layer2: {
    text: "AI導入で最も気になる点は？",
    options: [
      "コスト・投資対効果",
      "規制・コンプライアンス",
      "セキュリティ・個人情報",
      "業務効率化・省力化",
      "医療の質・患者体験",
    ],
  },

  // レイヤー3: 現在のフェーズ（体験のため）
  layer3: {
    text: "AI導入の現在のフェーズは？",
    options: [
      "情報収集・検討段階",
      "具体的に導入準備中",
      "既に一部で運用中",
      "見直し・拡大を検討中",
    ],
  },

  // レイヤー4: 具体的な課題（深掘り質問）
  layer4: {
    "コスト・投資対効果": {
      text: "コスト面で特に知りたいことは？",
      options: [
        "初期費用の相場感",
        "ランニングコストの見積もり",
        "ROI・費用対効果の計算",
        "補助金・助成金の活用",
      ],
    },
    "規制・コンプライアンス": {
      text: "規制面で特に気になることは？",
      options: [
        "医療機器該当性（SaMD）",
        "個人情報保護法の対応",
        "医療広告ガイドライン",
        "AI事業者ガイドライン",
      ],
    },
    "セキュリティ・個人情報": {
      text: "セキュリティ面で特に気になることは？",
      options: [
        "患者データの取り扱い",
        "クラウド利用のリスク",
        "ベンダー選定の基準",
        "インシデント対応体制",
      ],
    },
    "業務効率化・省力化": {
      text: "効率化したい業務は？",
      options: [
        "文書作成（紹介状等）",
        "画像診断支援",
        "問診・トリアージ",
        "事務・レセプト業務",
      ],
    },
    "医療の質・患者体験": {
      text: "向上させたい領域は？",
      options: [
        "診断精度・見落とし防止",
        "患者説明・IC",
        "待ち時間・予約管理",
        "フォローアップ",
      ],
    },
  },

  // 結論マッピング（layer2の関心領域 → 実際の記事ID）
  // ※layer4の回答は結論メッセージの文言調整に使用
  conclusionsByInterest: {
    "コスト・投資対効果": [
      "clinic_roi_2025",      // ROI分析
      "ai_economics",         // 経済性評価
      "why_ai_fails",         // 導入失敗の原因
      "japan_reboot_2040",    // 2040年計画
    ],
    "規制・コンプライアンス": [
      "ehr_3sho2",            // 3省2ガイドライン
      "state_of_ai_2025",     // State of AI 2025
      "japan_reboot_2040",    // 2040年計画
      "japan_ai_frontier",    // 日本の医療AI最前線
    ],
    "セキュリティ・個人情報": [
      "ehr_3sho2",            // 3省2ガイドライン
      "hospital_perfect_answer", // 導入の正解
      "automation_n8n",       // 業務自動化
      "why_ai_fails",         // 導入失敗の原因
    ],
    "業務効率化・省力化": [
      "automation_n8n",       // 業務自動化
      "outreach",             // 予防的アウトリーチ
      "regional_ai",          // 地域医療AI
      "clinic_roi_2025",      // ROI分析
    ],
    "医療の質・患者体験": [
      "ai_psy_therapy",       // AIセラピー
      "outreach",             // 予防的アウトリーチ
      "japan_ai_frontier",    // 日本の医療AI最前線
      "regional_ai",          // 地域医療AI
    ],
  } as Record<string, string[]>,
};

// =======================
// フロー取得関数
// =======================

export function getFlowForKeyword(keyword: DiagnosisKeyword) {
  // 現時点では病院AIリスク診断のみ詳細フローを実装
  // 他のキーワードは後で追加
  if (keyword === "病院AIリスク診断") {
    return HOSPITAL_FLOW;
  }
  return null;
}

/**
 * 次の質問を取得
 */
export function getNextQuestion(
  state: DiagnosisState
): DiagnosisQuestion | null {
  const flow = getFlowForKeyword(state.keyword);
  if (!flow) return null;

  const { layer, answers } = state;

  if (layer === 1) {
    return flow.layer1;
  }
  if (layer === 2) {
    return flow.layer2;
  }
  if (layer === 3) {
    return flow.layer3;
  }
  if (layer === 4) {
    // layer2 の回答（関心領域）に基づいて分岐
    const interest = answers[1]; // layer2 の回答
    const layer4Questions = flow.layer4[interest as keyof typeof flow.layer4];
    if (layer4Questions) {
      return layer4Questions;
    }
  }

  return null;
}

/**
 * 結論を取得（layer2 の関心領域に基づく）
 */
export function getConclusion(state: DiagnosisState): string[] | null {
  const flow = getFlowForKeyword(state.keyword);
  if (!flow) return null;

  // 4問すべて回答済みか確認
  if (state.answers.length < 4) {
    return null;
  }

  // layer2 の回答（関心領域）で結論を決定
  const interest = state.answers[1];
  return flow.conclusionsByInterest[interest] ?? null;
}

/**
 * 現在の質問の選択肢を取得
 */
export function getCurrentOptions(state: DiagnosisState): string[] | null {
  const question = getNextQuestion(state);
  return question?.options ?? null;
}

/**
 * 回答が有効か確認（選択肢に含まれているか）
 */
export function isValidAnswer(state: DiagnosisState, answer: string): boolean {
  const options = getCurrentOptions(state);
  if (!options) return false;
  return options.includes(answer);
}

/**
 * 質問メッセージを生成（Quick Reply 用）
 */
export function buildQuestionMessage(
  question: DiagnosisQuestion,
  layer: number
): { text: string; quickReply: object } {
  const text = `【質問 ${layer}/4】\n\n${question.text}`;

  const quickReply = {
    items: [
      // 選択肢
      ...question.options.map((opt) => ({
        type: "action",
        action: {
          type: "message",
          label: opt.length > 20 ? opt.substring(0, 17) + "..." : opt,
          text: opt,
        },
      })),
      // キャンセルボタン
      {
        type: "action",
        action: {
          type: "message",
          label: "キャンセル",
          text: "キャンセル",
        },
      },
    ],
  };

  return { text, quickReply };
}

/**
 * 結論メッセージを生成
 */
export function buildConclusionMessage(
  state: DiagnosisState,
  articles: Array<{ title: string; url: string | null }>
): string {
  const lines: string[] = [
    `【${state.keyword}】診断結果`,
    "",
    "あなたの回答：",
    ...state.answers.map((a, i) => `${i + 1}. ${a}`),
    "",
    "📚 おすすめ記事：",
    "",
  ];

  articles.forEach((article, i) => {
    lines.push(`${i + 1}. ${article.title}`);
    if (article.url) {
      lines.push(article.url);
    }
    if (i < articles.length - 1) {
      lines.push("");
    }
  });

  lines.push("");
  lines.push("---");
  lines.push("💬 さらに詳しく相談するなら Discord へ");
  lines.push(DISCORD_INVITE_URL);

  return lines.join("\n");
}

/**
 * 診断開始メッセージを生成
 */
export function buildDiagnosisStartMessage(keyword: DiagnosisKeyword): {
  text: string;
  quickReply: object;
} | null {
  const flow = getFlowForKeyword(keyword);
  if (!flow) return null;

  const question = flow.layer1;
  const text = [
    `【${keyword}】を開始します`,
    "",
    "4つの質問に答えると、あなたに最適な記事をご案内します。",
    "",
    `【質問 1/4】`,
    question.text,
  ].join("\n");

  const quickReply = {
    items: question.options.map((opt) => ({
      type: "action",
      action: {
        type: "message",
        label: opt.length > 20 ? opt.substring(0, 17) + "..." : opt,
        text: opt,
      },
    })),
  };

  return { text, quickReply };
}

