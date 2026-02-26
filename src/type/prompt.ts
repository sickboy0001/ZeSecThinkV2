export interface ModelConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: any; // その他の設定を許容
}

export interface PromptVersion {
  id: number;
  template_id: number;
  version: number;
  content: string;
  comment: string | null;
  model_config: ModelConfig;
  is_active: boolean;
  created_by: string; // UUID
  created_at: string; // ISO 8601 形式の文字列
}
// 特定のメソッドで一部のカラムのみ取得する場合の型（Pickを使用）
export type ActivePromptResponse = Pick<
  PromptVersion,
  "version" | "content" | "model_config"
>;
