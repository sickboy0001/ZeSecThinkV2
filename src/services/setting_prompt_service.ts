"use server";

import { executeQuery } from "@/lib/actions";
import { ActivePromptResponse, PromptVersion } from "@/type/prompt";
import { revalidatePath } from "next/cache";
import {
  default_typo_prompt,
  default_week_summary_prompt,
} from "@/constants/gai_constants";

interface SavePromptParams {
  userId: string;
  slug: string;
  content: string;
  comment: string;
  model: string;
  temp: number;
}

/*
export async function getActivePromp({
    const activeSlug = "typo_prompt"
    const [pData] = await Promise.all([
      getActivePrompt(activeSlug)
          ]);
    const prompt = pData.content
     */
export async function savePromptVersion({
  userId,
  slug,
  content,
  comment,
  model,
  temp,
}: SavePromptParams) {
  // JSONB形式でモデル設定を保存するためのオブジェクト
  const modelConfig = JSON.stringify({ model, temperature: temp });

  // シングルクォートのエスケープ
  const escapedContent = content.replace(/'/g, "''");
  const escapedComment = comment.replace(/'/g, "''");

  const query = `
DO $$
DECLARE
    v_template_id integer;
    v_new_version integer;
    v_slug text := '${slug}';
BEGIN
    -- 1. prompt_templates がなければ作成、あれば取得 (UPSERT的な動き)
    INSERT INTO prompt_templates (slug, name, description, created_at)
    VALUES (v_slug, v_slug, 'Auto generated template', NOW())
    ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug -- 何もしないがIDを取得するため
    RETURNING id INTO v_template_id;

    -- もし上記で見つからなかった場合の安全策（念のため）
    IF v_template_id IS NULL THEN
        SELECT id INTO v_template_id FROM prompt_templates WHERE slug = v_slug;
    END IF;

    -- 2. 現在の最大バージョンを取得してインクリメント
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version 
    FROM prompt_versions 
    WHERE template_id = v_template_id;

    -- 3. 既存のアクティブフラグをすべてオフにする
    UPDATE prompt_versions 
    SET is_active = false 
    WHERE template_id = v_template_id;

    -- 4. 新しいバージョンを挿入
    INSERT INTO prompt_versions (
        template_id,
        version,
        content,
        comment,
        model_config,
        is_active,
        created_by,
        created_at
    ) VALUES (
        v_template_id,
        v_new_version,
        '${escapedContent}',
        '${escapedComment}',
        '${modelConfig}'::jsonb,
        true,
        '${userId}',
        NOW()
    );
END $$;
`;

  const result = await executeQuery(query);

  if (!result.success) {
    console.error("Save prompt failed:", result.error);
    throw new Error(`保存に失敗しました: ${result.error}`);
  }

  revalidatePath("/setting/prompt"); // 画面のパスに合わせて変更してください
  return { success: true };
}
/*
 * 指定したslugのプロンプト全履歴を取得する
 */
export async function getPromptHistory(
  slug: string,
): Promise<PromptVersion[] | null> {
  const query = `
    SELECT 
      pv.id,
      pv.template_id,
      pv.version,
      pv.content,
      pv.comment,
      pv.is_active,
      pv.model_config,
      pv.created_at,
      pv.created_by
    FROM prompt_templates pt
    JOIN prompt_versions pv ON pt.id = pv.template_id
    WHERE pt.slug = '${slug}'
    ORDER BY pv.version DESC;
  `;

  const result = await executeQuery(query);

  if (!result.success || !Array.isArray(result.data)) {
    console.error(
      `Failed to fetch prompt history for slug ${slug}:`,
      result.error,
    );
    return null;
  }

  return result.data as unknown as PromptVersion[];
}

/**
 * 指定したslugの現在アクティブなプロンプトを取得する
 */
export async function getActivePrompt(
  slug: string,
): Promise<ActivePromptResponse | null> {
  const query = `
    SELECT 
      pv.version,
      pv.content,
      pv.model_config
    FROM prompt_templates pt
    JOIN prompt_versions pv ON pt.id = pv.template_id
    WHERE pt.slug = '${slug}' 
      AND pv.is_active = true
    LIMIT 1;
  `;

  const result = await executeQuery(query);

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0] as unknown as ActivePromptResponse;
  }

  // DBにない場合は定数からデフォルト値を取得
  let fallbackContent = "";
  if (slug === "typo_prompt") {
    fallbackContent = default_typo_prompt;
  } else if (slug === "week_summary_prompt") {
    fallbackContent = default_week_summary_prompt;
  }

  if (fallbackContent) {
    return {
      version: 0,
      content: fallbackContent,
      model_config: { model: "gemini-1.5-flash", temperature: 0.7 },
    } as unknown as ActivePromptResponse;
  }

  return null;
}
