"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Tags } from "lucide-react";
import { toast } from "sonner";
import {
  ZstuPost,
  createZstuPost,
  updateZstuPost,
} from "@/services/zstuposts_service";

interface Props {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentDate: Date;
  post?: ZstuPost | null;
  postCount: number;
}

export function PostsRegistDialog({
  userId,
  isOpen,
  onOpenChange,
  onSuccess,
  currentDate,
  post,
  postCount,
}: Props) {
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTagsVisible, setIsTagsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setElapsedTime(0); // Reset timer when modal opens
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      if (post) {
        setNewPostTitle(post.title || "");
        setNewPostContent(post.content || "");
        const postTags = post.tags?.join(", ") || "";
        setTagsInput(postTags);
        // 既存のタグがあれば、タグ入力欄を最初から表示する
        setIsTagsVisible(!!postTags);
      } else {
        setNewPostTitle("");
        setNewPostContent("");
        setTagsInput("");
        // 新規作成時はタグ入力欄を非表示にする
        setIsTagsVisible(false);
      }
    }
    return () => {
      clearInterval(timer);
    };
  }, [isOpen, post]);

  const handleCreatePost = async () => {
    if (!newPostTitle.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }
    if (!newPostContent.trim()) {
      toast.error("内容を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (post) {
        await updateZstuPost(post.id, {
          title: newPostTitle.trim(),
          content: newPostContent,
          tags: tags,
          second: (post.second || 0) + elapsedTime,
        });
        toast.success("投稿を更新しました");
      } else {
        await createZstuPost(userId, {
          title: newPostTitle.trim(),
          content: newPostContent,
          tags: tags,
          second: elapsedTime,
          current_at: currentDate,
        });
        toast.success("投稿を作成しました");
      }

      setNewPostContent("");
      setNewPostTitle("");
      setTagsInput("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const isToday =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth() &&
    today.getDate() === currentDate.getDate();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-baseline">
            {post ? "Edit" : "Add"}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              [{currentDate.getMonth() + 1}月{currentDate.getDate()}日]
            </span>
            {postCount !== 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                [{postCount}/10]
              </span>
            )}
          </DialogTitle>
          {!isToday && (
            <p className="text-xs text-red-500 font-bold text-left">
              ※今日以外の日付を編集中です
            </p>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              id="title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="タイトル"
              className="flex-grow text-lg!"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsTagsVisible(!isTagsVisible)}
              className="shrink-0"
            >
              <Tags className="h-4 w-4" />
            </Button>
          </div>
          {isTagsVisible && (
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="タグ (カンマ区切りで入力 例: xx,yy,zzz)"
              className="animate-in fade-in-0 zoom-in-95"
            />
          )}
          <Textarea
            id="content"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="内容"
            className="h-40 resize-none text-lg"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreatePost}
            disabled={isSubmitting}
            className="w-full py-1 text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "更新"
            )}
            <span className="px-2 w-24 text-left font-mono">
              [{elapsedTime}sec.]
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
