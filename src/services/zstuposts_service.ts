"use server";

import { executeQuery } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import * as AiLogService from "./ai_log_service";

export type SummaryDate = {
  date: string;
  post_count: number;
  total_seconds: number;
  total_chars: number;
};

export interface ZstuPost {
  id: number;
  user_id: string;
  current_at: string;
  title: string;
  content: string;
  tags: string[];
  source_type?: string;
  source_key?: string;
  source_detail?: any;
  second: number;
  public_flg: boolean;
  public_content_flg: boolean;
  delete_flg: boolean;
  write_start_at?: string;
  write_end_at?: string;
  created_at: string;
  updated_at: string;
  state_detail?: {
    ai_request?: {
      status: string;
      updated_at: Date;
    };
  };
}

export async function getZstuPostsSummary(
  userid: string,
): Promise<SummaryDate[] | null> {
  const query = `

  SELECT 
      date_series.day::date AS date,
      COUNT(p.id) AS post_count,
      SUM(COALESCE(p.second, 0)) AS total_seconds,
      SUM(COALESCE(length(p.content), 0)) AS total_chars -- 文字数の合計
  FROM 
      -- 今日から遡って7日間の日付列を生成
      generate_series((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date - INTERVAL '6 days', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Tokyo')::date, '1 day') AS date_series(day)
  LEFT JOIN 
      zstu_posts p ON p.current_at::date = date_series.day::date 
      AND p.user_id = '${userid}'
      AND p.delete_flg = false
  GROUP BY 
      date_series.day
  ORDER BY 
      date_series.day DESC;
  `;

  const result = await executeQuery(query);

  if (
    !result.success ||
    !Array.isArray(result.data) ||
    result.data.length === 0
  ) {
    console.error(`Failed to fetch item with id ${userid}:`, result.error);
    return null;
  }

  return result.data as unknown as SummaryDate[];
}

export async function getZstuPostsWithDate(
  userid: string,
  startDate: string,
  endDate: string,
): Promise<ZstuPost[] | null> {
  const query = `
    SELECT *
    FROM zstu_posts
    WHERE user_id = '${userid}'
      AND delete_flg = false
      AND current_at::date >= '${startDate}'
      AND current_at::date <= '${endDate}'
    ORDER BY current_at DESC,created_at desc
    `;

  const result = await executeQuery(query);

  if (!result.success || !Array.isArray(result.data)) {
    console.error(`Failed to fetch posts for user ${userid}:`, result.error);
    return null;
  }

  return result.data as unknown as ZstuPost[];
}

export async function getZstuPostsWithIds(
  ids: number[],
): Promise<ZstuPost[] | null> {
  const query = `
    SELECT *
    FROM zstu_posts
    WHERE delete_flg = false
      and id in (${ids.join(", ")})
    `;

  const result = await executeQuery(query);

  if (!result.success || !Array.isArray(result.data)) {
    console.error(`Failed to fetch posts for `, result.error);
    return null;
  }

  return result.data as unknown as ZstuPost[];
}

// ステータスの型を定義
export type AiRequestStatus =
  | "unprocessed"
  | "processing"
  | "pending_requeue"
  | "refined"
  | "completed";

export interface AiRequestDetail {
  status: AiRequestStatus;
  updated_at: string;
  is_edited: boolean;
  is_fixed: boolean;
  last_refinement_id?: number | null;
  last_error?: string | null;
}

// 既存のインポートに追加
// import { createClient } from "@/utils/supabase/client"; // プロジェクトに合わせて変更してください

export interface UpdateZstuPostParams {
  title?: string;
  content?: string;
  tags?: string[];
  second?: number;
  public_flg?: boolean;
  delete_flg?: boolean;
  // state_detailを追加
  state_detail?: {
    ai_request: AiRequestDetail;
  };
}

export interface CreateZstuPostParams {
  title: string;
  content: string;
  tags: string[];
  second: number;
  current_at?: Date;
}

export const createZstuPost = async (
  userId: string,
  params: CreateZstuPostParams,
) => {
  const supabase = await createClient();

  let currentAtVal = undefined;
  if (params.current_at) {
    // JST（'Asia/Tokyo'）での日付部分を 'YYYY-MM-DD' 形式で安全に取得します。
    // `toISOString()` は常にUTCを返すため、JSTの午前9時より前の時間は前日にされてしまう問題がありました。
    // `Intl.DateTimeFormat` を使うことで、実行環境に依存せず、指定したタイムゾーンでの日付を正確に取得できます。
    // 'en-CA' ロケールは 'YYYY-MM-DD' 形式を返すため、これを採用します。
    const datePart = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(params.current_at);

    currentAtVal = datePart;
  }

  const { error } = await supabase.from("zstu_posts").insert({
    user_id: userId,
    title: params.title,
    content: params.content,
    tags: params.tags,
    second: params.second,
    current_at: currentAtVal,
    public_flg: false,
    public_content_flg: false,
  });

  if (error) {
    throw error;
  }
};

export const deleteZstuPost = async (id: number) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from("zstu_posts")
    .update({
      delete_flg: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
};

export const deleteZstuPostPhysically = async (id: number) => {
  const supabase = await createClient();

  const { error } = await supabase.from("zstu_posts").delete().eq("id", id);

  if (error) {
    throw error;
  }
};

/**
 * 共通：ai_request オブジェクトを生成するヘルパー（内部用）
 */
function createAiRequestDetail(
  status: AiRequestStatus,
  overrides?: Partial<AiRequestDetail>,
): AiRequestDetail {
  return {
    status,
    updated_at: new Date().toISOString(),
    is_edited: overrides?.is_edited ?? false,
    is_fixed: overrides?.is_fixed ?? false,
    last_refinement_id: overrides?.last_refinement_id ?? null,
    last_error: overrides?.last_error ?? null,
  };
}

/**
 * 1. 未処理状態に戻す (初期化・再バッチ対象)
 */
export const updateZstuPostUnprocessed = async (
  id: number,
  params: UpdateZstuPostParams = {},
) => {
  const state_detail = {
    ai_request: createAiRequestDetail("unprocessed", {
      is_edited: false,
      is_fixed: false,
    }),
  };
  return await updateZstuPost(id, { ...params, state_detail });
};

/**
 * 2. 完了状態にする (ユーザー確定時)
 */
export const updateZstuPostCompleted = async (
  id: number,
  params: UpdateZstuPostParams = {},
) => {
  const state_detail = {
    ai_request: createAiRequestDetail("completed", { is_fixed: true }),
  };
  return await updateZstuPost(id, { ...params, state_detail });
};

/**
 * 3. 編集済みとして完了状態にする
 */
export const updateZstuPostCompletedWithIsEdited = async (
  id: number,
  params: UpdateZstuPostParams = {},
) => {
  const state_detail = {
    ai_request: createAiRequestDetail("completed", {
      is_fixed: true,
      is_edited: true,
    }),
  };
  return await updateZstuPost(id, { ...params, state_detail });
};

/**
 * 基本となる更新関数 (state_detail 対応版)
 */
export const updateZstuPost = async (
  id: number,
  params: UpdateZstuPostParams,
) => {
  const supabase = await createClient();

  // 更新用オブジェクトを作成（undefinedの項目は更新しない）
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  if (params.title !== undefined) updateData.title = params.title;
  if (params.content !== undefined) updateData.content = params.content;
  if (params.tags !== undefined) updateData.tags = params.tags;
  if (params.second !== undefined) updateData.second = params.second;
  if (params.public_flg !== undefined)
    updateData.public_flg = params.public_flg;
  if (params.delete_flg !== undefined)
    updateData.delete_flg = params.delete_flg;
  // JSONBの更新
  if (params.state_detail !== undefined) {
    updateData.state_detail = params.state_detail;
  }

  const { error } = await supabase
    .from("zstu_posts")
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw error;
  }
};

/**
 * AIの修正案を元に投稿を更新し、履歴に適用済みフラグを立てる
 */
export async function updateZstuPostWithAILog(
  id: number,
  batchId: number,
  params: UpdateZstuPostParams,
) {
  // 1. 投稿本体の更新 (既存の関数を再利用)
  await updateZstuPost(id, params);

  // 2. AI履歴テーブルの更新
  // params から必要な値を取り出す
  await AiLogService.applyAiRefinementHistory(id, batchId, {
    fixed_title: params.title || "",
    fixed_text: params.content || "",
    fixed_tags: params.tags || [],
  });
}
