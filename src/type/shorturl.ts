export interface urlinfo {
  created_at: string; // ISO 8601 形式の文字列
  uuid: string; // UUID
  system_name: string;
  user_id: string; // UUID
  batch_id: string | null;
  parameters: Record<string, unknown>;
}
// 特定のメソッドで一部のカラムのみ取得する場合の型（Pickを使用）
/*    select 
      created_at  ,
      uuid,
      system_name ,
      user_id ,
      parameters->>'batch_id' AS batch_id ,
      parameters 
    from uuid_mapping
    where short_id = '${shortId}'
    limit 1
 */
