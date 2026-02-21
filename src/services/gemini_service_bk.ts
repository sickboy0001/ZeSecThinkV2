import { ZstuPost } from "@/services/zstuposts_service";
import { getFormattedTagsJson } from "./zstutags_service";

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

// Helper function to process Gemini API requests in chunks
export async function processGeminiRefinement(
  userId: string,
  posts: ZstuPost[],
  promptTemplate: string,
  onLog: (message: string) => void,
): Promise<{ rawText: string; results: RefinementResult[] }> {
  const log = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ja-JP", { hour12: false });
    onLog(`[${timeStr}] ${message}`);
  };

  const requestTagsJson = await getFormattedTagsJson(userId);
  const chunkSize = CHUNK_SIZE;
  let allRefinementResults: RefinementResult[] = [];
  let combinedRawText = "";
  const totalChunks = Math.ceil(posts.length / chunkSize);

  log(
    `処理開始: 全${posts.length}件を${totalChunks}つのチャンクに分割して処理します。`,
  );

  for (let i = 0; i < posts.length; i += chunkSize) {
    const chunkIndex = Math.floor(i / chunkSize) + 1;

    if (i > 0) {
      log(
        `APIレート制限回避のため、${WAIT_TIME_MS / 1000}秒間待機しています... (${chunkIndex}/${totalChunks})`,
      );
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIME_MS));
    }

    log(`チャンク ${chunkIndex}/${totalChunks} を送信中...`);

    const chunk = posts.slice(i, i + chunkSize);
    const requestMemo = chunk.map((post) => ({
      id: post.id,
      tags: post.tags || [],
      title: post.title,
      text: post.content,
    }));

    const requestJson = JSON.stringify({ request_memo: requestMemo }, null, 2);

    //メモの置換（コンテンツ）
    let prompt = promptTemplate;
    if (prompt.includes("{memo}")) {
      prompt = prompt.replace("{memo}", requestJson);
    } else {
      prompt = `${prompt}\n\n${requestJson}`;
    }
    //タグ tags の置換
    if (prompt.includes("{tags}")) {
      prompt = prompt.replace("{tags}", requestTagsJson);
    } else {
      prompt = `${prompt}\n\n${requestTagsJson}`;
    }

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

        if (!res.ok) {
          const error: any = new Error(
            res.statusText || `HTTP Error ${res.status}`,
          );
          error.status = res.status;
          throw error;
        }

        const data = await res.json();
        combinedRawText += data.text + "\n";

        // モデル名のログ出力
        if (data.model) {
          log(`受信完了 (Model: ${data.model}, API: ${data.apiVersion})`);
        }

        try {
          const cleanJson = data.text.replace(/```json\n|\n```/g, "").trim();
          const parsed = JSON.parse(cleanJson) as AiResponse;
          if (parsed.refinement_results) {
            allRefinementResults = [
              ...allRefinementResults,
              ...parsed.refinement_results,
            ];
            log(
              `チャンク ${chunkIndex} 完了: ${parsed.refinement_results.length}件の修正案を受信しました。`,
            );
          } else {
            log(
              `警告: チャンク ${chunkIndex} のレスポンスに修正結果が含まれていませんでした。`,
            );
          }
        } catch (e) {
          console.warn("Failed to parse chunk result", e);
          log(`警告: チャンク ${chunkIndex} のJSONパースに失敗しました。`);
        }
        success = true;
      } catch (error: any) {
        retryCount++;

        if (retryCount > maxRetries) {
          log(
            `エラー: チャンク ${chunkIndex} のリクエストが失敗しました (最大リトライ回数超過): ${error}`,
          );
          throw error;
        }

        let delay = 5000;
        if (error.status === 503) {
          delay = 5000 * Math.pow(2, retryCount); // 503の場合は待機時間を倍々に増やす (10s, 20s, 40s...)
          log(
            `負荷高騰(503)のため再試行中... 残り${maxRetries - retryCount + 1}回。${delay / 1000}秒待機します。`,
          );
        } else {
          log(
            `エラー: チャンク ${chunkIndex} のリクエストが失敗しました (${error})。${delay / 1000}秒後にリトライします (${retryCount}/${maxRetries})...`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  log("全処理完了。");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { rawText: combinedRawText, results: allRefinementResults };
}
