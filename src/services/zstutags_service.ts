"use server";

import { executeQuery } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export interface Tag {
  id: number;
  tag_name: string;
  name: string;
  aliases: string[];
  description: string;
  display_order: number;
  is_active: boolean;
  is_send_ai: boolean;
  updated_at: Date;
}

export async function getZstuTags(userid: string): Promise<Tag[] | null> {
  const query = `
      select 
          id,
          tag_name , 
          name , 
          COALESCE(aliases, '{}') as aliases , 
          description , 
          display_order , 
          is_active , 
          is_send_ai , 
          updated_at
      from zstu_tag_descriptions
      where user_id = '${userid}'
      order by display_order 
  `;

  const result = await executeQuery(query);

  if (
    !result.success ||
    !Array.isArray(result.data) ||
    result.data.length === 0
  ) {
    console.error(`Failed to fetch tags for user ${userid}:`, result.error);
    return null;
  }

  return result.data as unknown as Tag[];
}

export async function updateZstuTag(id: number, updates: Partial<Tag>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("zstu_tag_descriptions")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error(`Failed to update tag ${id}:`, error);
    throw error;
  }
}

export async function createZstuTag(userId: string, tag: Partial<Tag>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zstu_tag_descriptions")
    .insert({ ...tag, user_id: userId })
    .select();

  if (error) {
    console.error("Failed to create tag:", error);
    throw error;
  }
  return data?.[0] as Tag;
}

export async function deleteZstuTag(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("zstu_tag_descriptions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Failed to delete tag ${id}:`, error);
    throw error;
  }
}

/**
 * 複数のタグの表示順を一括で更新します。
 * @param updates 更新するタグのIDと新しい表示順の配列
 */
export async function updateZstuTagsOrder(
  userId: string,
  updates: { id: number; display_order: number }[],
) {
  const supabase = await createClient();

  // RPCでデータベース関数を呼び出す
  const { error } = await supabase.rpc("update_tags_order", {
    p_user_id: userId,
    p_updates: updates,
  });

  if (error) {
    console.error("Error updating tags order:", error);
    throw new Error("タグの並び順の更新に失敗しました。");
  }
}

export async function getFormattedTagsJson(userId: string) {
  const tags = await getZstuTags(userId);
  return JSON.stringify(
    {
      request_taglist: (tags || [])
        .filter((t) => t.is_active && t.is_send_ai)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((t) => ({
          name: t.name,
          tag_name: t.tag_name,
          aliases: t.aliases || [],
          description: t.description,
        })),
    },
    null,
    2,
  );
}
