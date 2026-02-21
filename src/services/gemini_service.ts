import { ZstuPost } from "@/services/zstuposts_service";
import { getFormattedTagsJson } from "./zstutags_service";
// 追加：作成したログサービスをインポート
import * as AiLogService from "./ai_log_service";

const CHUNK_SIZE = 20;
const WAIT_TIME_MS = 10000;

export type RefinementResult = {
  id: number;
  original_text: string;
  fixed_title: string;
  fixed_text: string;
  fixed_tags?: string[];
  changes: string[];
};

export type AiResponse = {
  refinement_results: RefinementResult[];
};

export async function processGeminiRefinement(
  userId: string,
  posts: ZstuPost[],
  promptTemplate: string,
  onLog: (message: string) => void,
): Promise<{ rawText: string; results: RefinementResult[]; batchId: number }> {
  const log = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ja-JP", { hour12: false });
    onLog(`[${timeStr}] ${message}`);
  };

  const requestTagsJson = await getFormattedTagsJson(userId);
  const totalChunks = Math.ceil(posts.length / CHUNK_SIZE);
  let allRefinementResults: RefinementResult[] = [];
  let combinedRawText = "";

  // ■ 1. バッチ登録
  let batchId: number;
  try {
    batchId = await AiLogService.createAiBatch(
      userId,
      totalChunks,
      posts.length,
    );
  } catch (e) {
    console.error("バッチ作成失敗", e);
    throw new Error("ログ記録の開始に失敗しました。");
  }

  log(
    `処理開始: 全${posts.length}件を${totalChunks}つのチャンクに分割して処理します。`,
  );

  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    const startTime = Date.now();

    if (i > 0) {
      log(`待機中... (${chunkIndex}/${totalChunks})`);
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME_MS));
    }

    log(`チャンク ${chunkIndex}/${totalChunks} を送信中...`);
    const chunk = posts.slice(i, i + CHUNK_SIZE);
    const requestMemo = chunk.map((p) => ({
      id: p.id,
      tags: p.tags || [],
      title: p.title,
      text: p.content,
    }));
    const requestJson = JSON.stringify({ request_memo: requestMemo }, null, 2);

    let prompt = promptTemplate
      .replace("{memo}", requestJson)
      .replace("{tags}", requestTagsJson);

    let retryCount = 0;
    const maxRetries = 3;
    let success = false;

    while (!success) {
      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const data = await res.json();
        const duration = Date.now() - startTime;

        // ■ 2. 実行ログ登録 (APIレスポンスの成否に関わらず生の出力を記録)
        const executionLogId = await AiLogService.createAiExecutionLog({
          batch_id: batchId,
          user_id: userId,
          chunk_index: chunkIndex,
          prompt_template: promptTemplate,
          raw_input_json: requestJson,
          raw_output_text: data.text,
          model_info: data.model,
          api_version: data.apiVersion,
          duration_ms: duration,
          status: "success",
          used_tags_snapshot: requestTagsJson,
          token_usage: data.usageMetadata,
        });

        combinedRawText += data.text + "\n";
        log(`受信完了 (Model: ${data.model})`);

        try {
          const cleanJson = data.text.replace(/```json\n|\n```/g, "").trim();
          const parsed = JSON.parse(cleanJson) as AiResponse;

          if (parsed.refinement_results) {
            // ■ 3. 修正履歴を一括登録
            const historyRecords = parsed.refinement_results.map(
              (result, idx) => {
                const original = chunk.find((p) => p.id === result.id);
                return {
                  post_id: result.id,
                  batch_id: batchId,
                  execution_log_id: executionLogId,
                  order_index: idx,
                  before_title: original?.title,
                  before_text: original?.content,
                  before_tags: JSON.stringify(original?.tags),
                  after_title: result.fixed_title,
                  after_text: result.fixed_text,
                  after_tags: JSON.stringify(result.fixed_tags),
                  changes_summary: JSON.stringify(result.changes),
                  is_edited: false,
                  applied: false,
                };
              },
            );

            await AiLogService.createAiRefinementHistories(historyRecords);
            allRefinementResults.push(...parsed.refinement_results);
            log(
              `チャンク ${chunkIndex} 完了: ${parsed.refinement_results.length}件保存。`,
            );
          }
        } catch (e) {
          log(
            `警告: チャンク ${chunkIndex} のパース・履歴保存に失敗しました。`,
          );
        }

        // 進捗更新
        await AiLogService.updateAiBatchStatus(batchId, {
          completed_chunks: chunkIndex,
        });
        success = true;
      } catch (error: any) {
        retryCount++;
        if (retryCount > maxRetries) {
          await AiLogService.updateAiBatchStatus(batchId, { status: "failed" });
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  // ■ 4. 全完了
  await AiLogService.updateAiBatchStatus(batchId, { status: "completed" });
  log("全処理完了。");
  return {
    rawText: combinedRawText,
    results: allRefinementResults,
    batchId: batchId, // これが必要
  };
}
