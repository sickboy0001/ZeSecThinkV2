import { AiRequestStatus } from "@/services/zstuposts_service";

/**
 * AIステータスに応じたラベルを取得する
 * @param status AIリクエストステータス
 * @returns 表示用ラベル
 */
export const getAiStatusLabel = (status?: string | null): string => {
  if (!status) return "AIステータス不明";

  switch (status as AiRequestStatus) {
    case "unprocessed":
      return "AI未処理";
    case "processing":
      return "AI処理中";
    case "refined":
      return "AI処理済み";
    case "completed":
      return "処理済み";
    case "pending_requeue":
      return "再キュー待機中";
    default:
      return "AIステータス不明";
  }
};
