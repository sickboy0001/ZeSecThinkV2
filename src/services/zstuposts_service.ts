"use server";

import { executeQuery } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SummaryDate = {
  date: string;
  post_count: number;
  total_seconds: number;
  total_chars: number;
};

export interface ZstuPost {
  id: number;
  user_id: string;
  current_at: Date;
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
  write_start_at?: Date;
  write_end_at?: Date;
  created_at: Date;
  updated_at: Date;
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
      generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS date_series(day)
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
    ORDER BY current_at DESC
  `;

  const result = await executeQuery(query);

  if (!result.success || !Array.isArray(result.data)) {
    console.error(`Failed to fetch posts for user ${userid}:`, result.error);
    return null;
  }

  return result.data as unknown as ZstuPost[];
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

  // 時刻情報は不要なので、日付部分のみを使用して 00:00:00 とする
  let currentAtVal = undefined;
  if (params.current_at) {
    const year = params.current_at.getFullYear();
    const month = String(params.current_at.getMonth() + 1).padStart(2, "0");
    const day = String(params.current_at.getDate()).padStart(2, "0");
    currentAtVal = `${year}-${month}-${day}T00:00:00`;
  }

  const { error } = await supabase.from("zstu_posts").insert({
    user_id: userId,
    title: params.title,
    content: params.content,
    tags: params.tags,
    second: params.second,
    current_at: currentAtVal,
    public_flg: true,
    public_content_flg: true,
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
  const { error } = await supabase
    .from("zstu_posts")
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw error;
  }
};
