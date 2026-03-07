"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useState, forwardRef, useImperativeHandle } from "react";
import { formatDateToJst } from "@/lib/date_util";
import {
  AiLogDetailStatus,
  updateAiRefinementHistoryFixedContent,
} from "@/services/ai_log_service";
import { X } from "lucide-react";
import { AutoResizeTextarea } from "@/components/atoms/AutoResizeTextarea";
import {
  updateZstuPostCompleted,
  updateZstuPostCompletedWithIsEdited,
} from "@/services/zstuposts_service";

interface Props {
  log: AiLogDetailStatus;
  isSelected: boolean;
  isPublic: boolean;
  onToggleSelection: () => void;
  onTogglePublic: () => void;
}

export interface AiLogDetailCardRef {
  saveData: () => Promise<void>;
}

const AiLogDetailCard = forwardRef<AiLogDetailCardRef, Props>(
  ({ log, isSelected, isPublic, onToggleSelection, onTogglePublic }, ref) => {
    useImperativeHandle(ref, () => ({
      saveData: async () => {
        const tagsToSave = editedTags || "";
        const cleanTagsArray = tagsToSave
          .split(",")
          .map((t) => t.trim().replace(/^\[?"?|"?\]?$/g, ""))
          .filter(Boolean);

        // 変更があったかどうかを判定
        const isEditedNow =
          editedTitle !== savedContentTitle ||
          editedContent !== savedContentText ||
          editedTags !== savedContentTags ||
          log.is_edited;

        // logを出すのみ
        // console.log("Saving data for log ID:", log.id);
        // console.log("post_id:", log.post_id);
        console.log("Saving data for Title:", editedTitle);
        // console.log("Content:", editedContent);
        // console.log("Tags:", cleanTagsArray);
        // console.log("is_edited:", isEditedNow);
        // console.log("is_public :", isPublic);

        // ai_refinement_logsの内容を保存するため、log.idとeditedTitle, editedContent, editedTagsを渡して更新
        //updateAiRefinementHistoryFixedContentで更新する
        await updateAiRefinementHistoryFixedContent(
          log.id,
          editedTitle,
          editedContent,
          JSON.stringify(cleanTagsArray),
          isEditedNow,
        );

        // post.title post.content post.tags、post.state_detailの更新
        //  state_detail内のai_request.statusを"completed"に変更、is_editedも判断して更新

        if (isEditedNow) {
          //更新処理
          await updateZstuPostCompletedWithIsEdited(log.post_id, {
            title: editedTitle,
            content: editedContent,
            tags: cleanTagsArray,
            public_flg: isPublic,
          });
          //await updateZstuPostUnprocessed(id, { title: newTitle });
        } else {
          await updateZstuPostCompleted(log.post_id, {
            title: editedTitle,
            content: editedContent,
            tags: cleanTagsArray,
            public_flg: isPublic,
          });
        }
        //updateZstuPostCompletedWithIsEdited is_edited ならこちら
        //updateZstuPostCompleted is_edited でないならこちら
        //補足）updateZstuPostUnprocessed これは使わない、再度処理対象になるため
      },
    }));

    // ポスト・ポストに対応するAiLogDetailを表示するカード
    let savedContentTitle = log.fixed_title;
    let savedContentText = log.fixed_text;
    let savedContentTags = log.fixed_tags;
    let savedContentTextVisible = false;

    // console.log("alilogdetailcard log:", log);

    if (
      log.status === "refined" ||
      log.status === "unprocessed" ||
      log.status === "processing"
    ) {
      savedContentTitle = log.after_title || log.fixed_title || "";
      savedContentText = log.after_text || log.fixed_text || "";
      savedContentTags = log.after_tags || log.fixed_tags || "";
      savedContentTextVisible = true;
    } else if (log.status === "completed") {
      savedContentTextVisible = true;
    }

    const [editedTitle, setEditedTitle] = useState(savedContentTitle || "");
    const [editedContent, setEditedContent] = useState(savedContentText || "");
    const [editedTags, setEditedTags] = useState(savedContentTags || "");

    const isCompleted = log.status === "completed";

    const handleDeleteTag = (tagToDelete: string) => {
      const currentTags = editedTags
        .split(",")
        .map((t) => t.trim().replace(/^\[?"?|"?\]?$/g, ""))
        .filter(Boolean);
      const newTags = currentTags.filter((tag) => tag !== tagToDelete);
      setEditedTags(newTags.join(", "));
    };

    // 親(Table)から呼び出せるように、useImperativeHandleでメソッドを公開するための準備
    // forwardRef化が必要なため、この後export構造を変更します

    return (
      <Card key={log.id} className="overflow-hidden border-muted">
        <CardContent className="p-0">
          {/* Row 1: ID & PostID (最小限の高さに調整) */}
          <div className="bg-muted/30 px-4 py-1.5 border-b flex flex-wrap gap-x-6 gap-y-2 text-[13px] items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`select-${log.id}`}
                checked={isCompleted ? false : isSelected}
                onCheckedChange={onToggleSelection}
                disabled={isCompleted}
              />
              <label
                htmlFor={`select-${log.id}`}
                className={`cursor-pointer select-none ${isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"}`}
              >
                登録
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`public-${log.id}`}
                checked={isCompleted ? false : isPublic}
                onCheckedChange={onTogglePublic}
                disabled={isCompleted}
              />
              <label
                htmlFor={`public-${log.id}`}
                className={`cursor-pointer select-none ${isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"}`}
              >
                Public
              </label>
            </div>
            <div className="flex gap-1.5">
              <span className="text-muted-foreground">current_at:</span>
              <span className="font-bold">
                {formatDateToJst(log.current_at, "yyyy-MM-dd")}
              </span>
              <span className="font-bold">
                ({formatDateToJst(log.created_at)})
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-bold">{log.id}</span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-muted-foreground">PostID:</span>
              <span className="font-bold">{log.post_id}</span>
            </div>
            {/* 状況バッジ */}
            <div className="flex items-center gap-2">
              {log.status === "unprocessed" && (
                <div className="text-[11px] font-bold text-slate-600 bg-slate-50/50 w-fit px-1.5 py-0.5 rounded border border-slate-100">
                  未処理
                </div>
              )}
              {log.status === "processing" && (
                <div className="text-[11px] font-bold text-blue-600 bg-blue-50/50 w-fit px-1.5 py-0.5 rounded border border-blue-100">
                  処理中
                </div>
              )}
              {log.status === "refined" && (
                <div className="text-[11px] font-bold text-green-600 bg-green-50/50 w-fit px-1.5 py-0.5 rounded border border-green-100">
                  受領済(未登録)
                </div>
              )}
              {log.status === "completed" && (
                <div className="text-[11px] font-bold text-purple-600 bg-purple-50/50 w-fit px-1.5 py-0.5 rounded border border-purple-100">
                  保存済
                </div>
              )}
              {log.is_edited && (
                <div className="text-[11px] font-bold text-orange-600 bg-orange-50/50 w-fit px-1.5 py-0.5 rounded border border-orange-100">
                  更新済
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Before / After / Fixed */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-muted/50">
            {/* 変更前 */}
            <div className="p-4 space-y-2.5">
              <div className="text-[11px] font-bold text-red-600 bg-red-50/50 w-fit px-1.5 py-0.5 rounded border border-red-100">
                変更前
              </div>
              <div className="space-y-2">
                <p className="font-bold text-sm leading-snug">
                  {log.before_title}
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {log.before_text}
                </p>
                <div className="flex flex-wrap gap-1">
                  {log.before_tags
                    ?.split(",")
                    .map((t) => t.trim().replace(/^\[?"?|"?\]?$/g, ""))
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* 変更後 */}
            <div className="p-4 space-y-2.5">
              <div className="text-[11px] font-bold text-green-600 bg-green-50/50 w-fit px-1.5 py-0.5 rounded border border-green-100">
                AI精査後
              </div>
              <div className="space-y-2">
                <p className="font-bold text-sm leading-snug">
                  {log.after_title}
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {log.after_text}
                </p>
                <div className="flex flex-wrap gap-1">
                  {log.after_tags
                    ?.split(",")
                    .map((t) => t.trim().replace(/^\[?"?|"?\]?$/g, ""))
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* 保存内容 */}
            <div className="p-4 space-y-2.5 bg-slate-50/30">
              <div
                className={`text-[11px] font-bold w-fit px-1.5 py-0.5 rounded border ${
                  isCompleted
                    ? "text-slate-900 bg-slate-200/70 border-slate-300"
                    : "text-blue-700 bg-blue-50/50 border-blue-100 dark:focus:bg-blue-900/20"
                }`}
              >
                保存内容{isCompleted ? "（登録済み）" : ""}
              </div>
              <div className="space-y-2">
                {isCompleted ? (
                  <>
                    <p className="font-bold text-sm leading-snug">
                      {editedTitle}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {editedContent}
                    </p>
                  </>
                ) : (
                  <>
                    <AutoResizeTextarea
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={() => {}}
                      className="font-bold text-sm! shadow-none border-none focus-visible:ring-0 px-0 py-0 min-h-0 bg-transparent focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors"
                    />
                    <AutoResizeTextarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onBlur={() => {}}
                      className={`font-normal text-xs leading-relaxed  border-none px-0 py-0 bg-white ${
                        !savedContentTextVisible
                          ? "text-transparent select-none"
                          : ""
                      }`}
                      //text-lg leading-relaxed font-normal min-h-[120px] resize-none border-none shadow-none focus-visible:ring-0 px-0 py-0 bg-transparent
                    />
                  </>
                )}
                <div className="flex flex-wrap gap-1">
                  {editedTags
                    ?.split(",")
                    .map((t) => t.trim().replace(/^\[?"?|"?\]?$/g, ""))
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant={isCompleted ? "outline" : "secondary"}
                        className={
                          isCompleted ? "" : "flex items-center gap-1 pr-1"
                        }
                      >
                        {tag}
                        {!isCompleted && (
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Change Summary */}
          <div className="p-4 bg-orange-50/20">
            <div className="text-[11px] font-bold text-orange-700/80 uppercase tracking-wider mb-1.5">
              変更概要
            </div>
            <div className="text-[13px] leading-relaxed text-slate-700">
              {log.changes_summary}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

export default AiLogDetailCard;
