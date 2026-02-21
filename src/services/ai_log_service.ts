"use server";
import { turso } from "@/lib/turso/turso";

/**
 * 安全に値をSQLite（Turso）へ渡すための変換関数
 */
const safeVal = (v: any) => {
  if (v === undefined) return null;
  // オブジェクトや配列の場合はJSON文字列にする
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
};

/**
 * 1. AI処理バッチの作成
 */
export async function createAiBatch(
  userId: string,
  totalChunks: number,
  totalMemos: number,
) {
  const rs = await turso.execute({
    sql: `INSERT INTO ai_batches (user_id, total_chunks, total_memos, status) 
          VALUES (?, ?, ?, 'processing')`,
    args: [userId, totalChunks, totalMemos],
  });

  // Turso (libSQL) で挿入された ID を取得
  return Number(rs.lastInsertRowid);
}

/**
 * 2. バッチのステータス/進捗更新
 */
export async function updateAiBatchStatus(
  batchId: number,
  updates: { status?: string; completed_chunks?: number },
) {
  // 動的にSET句を構築
  const keys = Object.keys(updates);
  const setClause = keys.map((k) => `${k} = :${k}`).join(", ");

  await turso.execute({
    sql: `UPDATE ai_batches SET ${setClause} WHERE id = :batchId`,
    args: { ...updates, batchId },
  });
}
/**
 * 3. 実行ログ（チャンク単位）の登録
 */
export async function createAiExecutionLog(p: any) {
  // すべての引数を safeVal でラップして、Unsupported type を防ぐ
  const rs = await turso.execute({
    sql: `INSERT INTO ai_execution_logs (
            batch_id, user_id, chunk_index, prompt_template, raw_input_json, 
            raw_output_text, model_info, api_version, duration_ms, status, 
            used_tags_snapshot, error_payload, token_usage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      safeVal(p.batch_id),
      safeVal(p.user_id),
      safeVal(p.chunk_index),
      safeVal(p.prompt_template),
      safeVal(p.raw_input_json),
      safeVal(p.raw_output_text),
      safeVal(p.model_info),
      safeVal(p.api_version),
      safeVal(p.duration_ms),
      safeVal(p.status),
      safeVal(p.used_tags_snapshot),
      safeVal(p.error_payload),
      safeVal(p.token_usage),
    ],
  });

  return Number(rs.lastInsertRowid);
}

/**
 * 4. 修正履歴の一括登録
 */
export async function createAiRefinementHistories(histories: any[]) {
  const statements = histories.map((h) => ({
    sql: `INSERT INTO ai_refinement_history (
            post_id, batch_id, execution_log_id, order_index, 
            before_title, before_text, before_tags, 
            after_title, after_text, after_tags, changes_summary,
            is_edited, applied
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    args: [
      safeVal(h.post_id),
      safeVal(h.batch_id),
      safeVal(h.execution_log_id),
      safeVal(h.order_index),
      safeVal(h.before_title),
      safeVal(h.before_text),
      safeVal(h.before_tags), // JSONオブジェクトが来る可能性があるためsafeValを通す
      safeVal(h.after_title),
      safeVal(h.after_text),
      safeVal(h.after_tags), // JSONオブジェクトが来る可能性があるためsafeValを通す
      safeVal(h.changes_summary),
    ],
  }));

  await turso.batch(statements);
}

/**
 * 5. 投稿更新時にAI履歴の適用状態を更新する
 * ユーザーが最終的に微調整した内容（fixed_title等）も保存します
 */
export async function applyAiRefinementHistory(
  postId: number,
  batchId: number,
  data: {
    fixed_title: string;
    fixed_text: string;
    fixed_tags: string[];
  },
) {
  const fixedTagsJson = JSON.stringify(data.fixed_tags);

  await turso.execute({
    sql: `UPDATE ai_refinement_history 
          SET applied = 1, 
              applied_at = CURRENT_TIMESTAMP,
              fixed_title = ?,
              fixed_text = ?,
              fixed_tags = ?,
              is_edited = CASE 
                WHEN after_title = ? AND after_text = ? AND after_tags = ? THEN 0 
                ELSE 1 
              END
          WHERE post_id = ? AND batch_id = ?`,
    args: [
      data.fixed_title,
      data.fixed_text,
      fixedTagsJson,
      data.fixed_title, // after_titleと比較用
      data.fixed_text, // after_textと比較用
      fixedTagsJson, // after_tagsと比較用 ★追加
      postId,
      batchId,
    ],
  });
}
