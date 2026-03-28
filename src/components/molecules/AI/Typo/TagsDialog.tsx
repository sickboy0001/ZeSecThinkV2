// src/components/molecules/TagsDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Tag } from "@/services/zstutags_service";
import { toast } from "sonner";

interface TagsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (tag: Partial<Tag>) => Promise<void>;
  isCreating: boolean;
}

export function TagsDialog({
  isOpen,
  onOpenChange,
  onCreate,
  isCreating,
}: TagsDialogProps) {
  const [newTag, setNewTag] = useState<Omit<Partial<Tag>, "aliases">>({
    tag_name: "",
    name: "",
    description: "",
    display_order: 0,
    is_active: true,
    is_send_ai: false,
  });
  const [aliasesInput, setAliasesInput] = useState("");

  // ダイアログが閉じたときにステートをリセットする
  useEffect(() => {
    if (!isOpen) {
      setNewTag({
        tag_name: "",
        name: "",
        description: "",
        display_order: 0,
        is_active: true,
        is_send_ai: false,
      });
      setAliasesInput("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!newTag.tag_name) {
      toast.error("Tag Nameは必須です");
      return;
    }

    const aliases = aliasesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await onCreate({ ...newTag, aliases });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>新規タグ登録</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tag_name" className="text-right">
              Tag Name
            </Label>
            <Input
              id="tag_name"
              value={newTag.tag_name || ""}
              onChange={(e) =>
                setNewTag({ ...newTag, tag_name: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newTag.name || ""}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          {/* aliases */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aliases" className="text-right">
              Aliases
            </Label>
            <Input
              id="aliases"
              value={aliasesInput}
              onChange={(e) => setAliasesInput(e.target.value)}
              placeholder="カンマ区切り"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={newTag.description || ""}
              onChange={(e) =>
                setNewTag({ ...newTag, description: e.target.value })
              }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            登録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
