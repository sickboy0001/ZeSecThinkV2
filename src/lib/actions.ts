"use server";

import sql from "@/lib/db";

export async function executeQuery(query: string) {
  if (!query.trim()) {
    return { success: false, error: "Query is empty" };
  }

  try {
    // sql.unsafe は生のSQL文字列を実行します。
    // SQLインジェクションのリスクがあるため、信頼できるユーザーのみが使用する管理画面等でのみ使用してください。
    const data = await sql.unsafe(query);
    // postgres.jsの結果はJSONシリアライズ可能なオブジェクトの配列です
    return { success: true, data: data };
  } catch (error: any) {
    console.error("Database execution error:", error);
    return { success: false, error: error.message };
  }
}
