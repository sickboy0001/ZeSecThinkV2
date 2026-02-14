"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
}

export function PostsRegistDialog({
  userId,
  isOpen,
  onOpenChange,
  onSuccess,
  currentDate,
  post,
}: Props) {
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setElapsedTime(0); // Reset timer when modal opens
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      if (post) {
        setNewPostTitle(post.tags && post.tags.length > 0 ? post.tags[0] : "");
        setNewPostContent(post.content || "");
      } else {
        setNewPostTitle("");
        setNewPostContent("");
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
      if (post) {
        await updateZstuPost(post.id, {
          title: newPostTitle.trim(),
          content: newPostContent,
          tags: [newPostTitle.trim()],
          second: (post.second || 0) + elapsedTime,
        });
        toast.success("投稿を更新しました");
      } else {
        await createZstuPost(userId, {
          title: newPostTitle.trim(),
          content: newPostContent,
          tags: [newPostTitle.trim()],
          second: elapsedTime,
          current_at: currentDate,
        });
        toast.success("投稿を作成しました");
      }

      setNewPostContent("");
      setNewPostTitle("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-baseline">
            {post ? "Edit" : "Add"}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              [{currentDate.getMonth() + 1}月{currentDate.getDate()}日]
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="タイトル"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="内容"
              className="h-32 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreatePost}
            disabled={isSubmitting}
            className="w-full"
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
