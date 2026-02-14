"use server";

import { executeQuery } from "@/lib/actions";

export async function getPreviewData(userId: string, email: string) {
  // 1. Old User ID の取得 (mail_to_id テーブル)
  const idQuery = `SELECT id FROM mail_to_id WHERE mail = '${email}'`;
  const idResult = await executeQuery(idQuery);

  if (
    !idResult.success ||
    !Array.isArray(idResult.data) ||
    idResult.data.length === 0
  ) {
    return { error: `旧ユーザーIDが見つかりません: ${email}` };
  }

  const oldUserId = idResult.data[0].id;

  // 2. 旧データの件数取得
  const oldPostsQuery = `SELECT COUNT(*) as count FROM zst_post WHERE user_id = ${oldUserId}`;

  // 3. 新データの件数取得 (削除対象となる現在のデータ)
  const newPostsQuery = `SELECT COUNT(*) as count FROM zstu_posts WHERE user_id = '${userId}'`;

  const [oldPostsRes, newPostsRes] = await Promise.all([
    executeQuery(oldPostsQuery),
    executeQuery(newPostsQuery),
  ]);

  return {
    target_email: email,
    old_user_id: oldUserId,
    new_user_uuid: userId,
    old_data: {
      posts_count: Number(oldPostsRes.data?.[0]?.count || 0),
    },
    new_data: {
      posts_count: Number(newPostsRes.data?.[0]?.count || 0),
    },
  };
}

export async function executeConversion(userId: string, email: string) {
  // データ移行を実行する
  // トランザクションとして実行するために DO ブロックを使用
  const conversionQuery = `
DO $$
DECLARE
    v_old_user_id integer;
    -- アプリケーション側から渡される変数
    v_new_user_uuid uuid := '${userId}';
    v_email text := '${email}';
BEGIN
    -- 1. 旧システムでのユーザーIDを取得
    SELECT id INTO v_old_user_id FROM mail_to_id WHERE mail = v_email;
    
    IF v_old_user_id IS NULL THEN
        RAISE EXCEPTION '旧ユーザーIDが見つかりません: %', v_email;
    END IF;

    -- 2. 新テーブルから対象ユーザーの既存データを削除（冪等性の確保）
    DELETE FROM zstu_posts WHERE user_id = v_new_user_uuid;
    
    -- 3. zst_post から zstu_posts への移行実行
    INSERT INTO zstu_posts (
        user_id,
        current_at,
        title,
        content,
        tags,           -- 旧 title を配列として格納
        source_type,    -- 初期値は null
        source_key,     -- 初期値は null
        source_detail,  -- 初期値は null
        second,
        public_flg,
        public_content_flg,
        delete_flg,
        write_start_at,
        write_end_at,
        created_at,     -- create_at からマッピング
        updated_at      -- update_at からマッピング
    )
    SELECT 
        v_new_user_uuid,
        current_at,
        title,
        content,
        ARRAY[title],   -- 旧タイトルの値を1番目のタグとして配列化
        NULL,           -- source_type
        NULL,           -- source_key
        NULL,           -- source_detail
        second,
        public_flg,
        public_content_flg,
        delete_flg,
        write_start_at,
        write_end_at,
        create_at,      -- 名称変更対応
        update_at       -- 名称変更対応
    FROM zst_post
    WHERE user_id = v_old_user_id
    ORDER BY id ASC;

    -- ログ出力（任意）
    RAISE NOTICE 'zstu_posts への移行が完了しました。ユーザー: %', v_email;

END $$;
`;

  const result = await executeQuery(conversionQuery);

  if (!result.success) {
    console.error("Conversion failed:", result.error);
    throw new Error(`データ移行に失敗しました: ${result.error}`);
  }

  // 実行後の件数確認
  const finalItemsQuery = `SELECT COUNT(*) as count FROM zstu_posts WHERE user_id = '${userId}'`;

  const finalItemsRes = await executeQuery(finalItemsQuery);

  return {
    status: "success",
    items_count: Number(finalItemsRes.data?.[0]?.count || 0),
    logs_count: 0,
  };
}
