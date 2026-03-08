"use client";

import React, { useState } from "react";
import { Lock, Pencil, Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ZstuPost,
  deleteZstuPostPhysically,
  updateZstuPost,
  updateZstuPostUnprocessed,
} from "@/services/zstuposts_service";
import { AutoResizeTextarea } from "@/components/atoms/AutoResizeTextarea";
import { toast } from "sonner";

interface EditableFieldProps {
  value: string;
  onChange: (val: string) => void;
  onSave: (val: string) => void;
  isTextarea?: boolean;
  viewClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const EditableField = ({
  value,
  onChange,
  onSave,
  isTextarea = false,
  viewClassName,
  inputClassName,
  placeholder = "No content",
  onKeyDown,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [initialValue, setInitialValue] = useState("");

  const handleStartEdit = () => {
    setInitialValue(value);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  if (isEditing) {
    if (isTextarea) {
      return (
        <AutoResizeTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={inputClassName}
          autoFocus
        />
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBlur();
          }
          if (onKeyDown) onKeyDown(e);
        }}
        className={inputClassName}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`cursor-pointer min-h-6 ${viewClassName || ""}`}
    >
      {value || (
        <span className="text-muted-foreground opacity-50">{placeholder}</span>
      )}
    </div>
  );
};

interface PostCardProps {
  post: ZstuPost;
  isLast: boolean;
  onEdit: (post: ZstuPost) => void;
  onDeleted: () => void;
  onPostUpdated: (updatedPost: ZstuPost) => void;
}

export const PostCard = ({
  post,
  isLast,
  onEdit,
  onDeleted,
  onPostUpdated,
}: PostCardProps) => {
  const router = useRouter();

  // 内部関数: コピー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
      toast.success("クリップボードにコピーしました");
    } catch (error) {
      console.error(error);
      toast.error("コピーに失敗しました");
    }
  };

  // 内部関数: 物理削除
  const handleDelete = async () => {
    if (!confirm("本当に完全に削除しますか？この操作は取り消せません。"))
      return;

    try {
      await deleteZstuPostPhysically(post.id);
      toast.success("完全に削除しました");
      onDeleted();
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    }
  };

  // 内部関数: 編集
  const handleEdit = () => {
    onEdit(post);
  };

  // 内部関数: AI Refined クリック
  const handleAiRefinedClick = () => {
    if (!post.current_at) return;

    // Dateオブジェクトとして扱う（文字列でもDateオブジェクトでも対応可能にする）
    const date = new Date(post.current_at);
    if (isNaN(date.getTime())) return;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}${m}${d}`;

    router.push(`/AI/log/detailweek?date=${dateStr}`);
  };

  // 内部関数: 公開設定変更
  const handlePublicChange = async (checked: boolean) => {
    try {
      await updateZstuPost(post.id, { public_flg: checked });
      toast.success(`公開設定を${checked ? "オン" : "オフ"}にしました`);
      onPostUpdated({ ...post, public_flg: checked });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  // 内部関数: 削除フラグ変更
  const handleDeleteChange = async (checked: boolean) => {
    try {
      await updateZstuPost(post.id, { delete_flg: checked });
      toast.success(`削除フラグを${checked ? "オン" : "オフ"}にしました`);
      onPostUpdated({ ...post, delete_flg: checked });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  // 内部関数: タイトル保存
  const handleTitleSave = async (newTitle: string) => {
    try {
      await updateZstuPostUnprocessed(post.id, { title: newTitle });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  // 内部関数: コンテンツ保存
  const handleContentSave = async (newContent: string) => {
    try {
      await updateZstuPostUnprocessed(post.id, { content: newContent });
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  // ヘルパー関数: 詳細情報の描画
  const renderPostInfo = () => {
    const aiStatus = post.state_detail?.ai_request?.status;
    const updatedAt = post.state_detail?.ai_request?.updated_at;

    let statusLabel = "AIステータス不明";
    if (aiStatus === "unprocessed") statusLabel = "AI未処理";
    else if (aiStatus === "processing") statusLabel = "AI処理中";
    else if (aiStatus === "refined") statusLabel = "AI処理済み";
    else if (aiStatus === "completed") statusLabel = "処理済み";

    return (
      <div className="text-xs text-muted-foreground">
        [{post.second}sec]{" "}
        <span className="text-muted-foreground">{statusLabel}</span>
        {updatedAt && (
          <span className="text-muted-foreground">
            (更新日時:{" "}
            {new Date(updatedAt).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            )
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        {/* タイトル */}
        <div className="flex items-center gap-1 min-w-50">
          {!post.public_flg && (
            <Lock className="h-4 w-4 text-red-800 shrink-0" />
          )}
          <EditableField
            value={post.title}
            onChange={(val) => onPostUpdated({ ...post, title: val })}
            onSave={handleTitleSave}
            viewClassName="text-lg font-bold hover:underline decoration-dashed underline-offset-4"
            inputClassName="text-lg! font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto py-0 bg-transparent focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors"
            placeholder="タイトルなし"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* 編集ボタン */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-slate-200"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {/* コピー */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-slate-200"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* タグ */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {post.tags.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-xs font-normal text-muted-foreground bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* コンテンツ */}
      <EditableField
        isTextarea
        value={post.content}
        onChange={(val) => onPostUpdated({ ...post, content: val })}
        onSave={handleContentSave}
        viewClassName="text-lg leading-relaxed whitespace-pre-wrap font-normal hover:bg-slate-50/50 rounded p-1 -ml-1 transition-colors"
        inputClassName="text-lg leading-relaxed font-normal min-h-[120px] resize-none border-none shadow-none focus-visible:ring-0 px-0 py-0 bg-transparent"
        placeholder="内容なし"
      />

      <div className="flex flex-col gap-1">
        {/* 詳細情報 */}
        {renderPostInfo()}

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <Switch
              id={`pub-${post.id}`}
              checked={post.public_flg}
              onCheckedChange={handlePublicChange}
            />
            {/* 公開スイッチ */}
            <label htmlFor={`pub-${post.id}`} className="text-sm">
              public
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`del-${post.id}`}
              checked={post.delete_flg}
              onCheckedChange={handleDeleteChange}
            />
            {/* 削除スイッチ */}
            <label htmlFor={`del-${post.id}`} className="text-sm">
              delete
            </label>
          </div>

          {/* AI Refined Tag */}
          {post.state_detail?.ai_request?.status === "refined" && (
            <Badge
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold border-none ml-auto cursor-pointer"
              onClick={handleAiRefinedClick}
            >
              ai-refined
            </Badge>
          )}

          {/* 物理削除ボタン */}
          <Button
            variant="outline"
            className={`h-8 w-8 sm:w-auto text-xs border-slate-200 sm:px-3 sm:gap-1 ${
              post.state_detail?.ai_request?.status === "refined"
                ? "ml-2"
                : "ml-auto"
            }`}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Physical deletion</span>
          </Button>
        </div>
      </div>

      {!isLast && <Separator className="mt-4 bg-slate-300" />}
    </div>
  );
};
