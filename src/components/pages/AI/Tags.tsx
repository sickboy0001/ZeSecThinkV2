"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// --- Tabs関連のインポートを追加 ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getZstuTags,
  updateZstuTag,
  createZstuTag,
  deleteZstuTag,
  updateZstuTagsOrder,
  Tag,
} from "@/services/zstutags_service";
import { toast } from "sonner";
import { Plus, Code, Table as TableIcon } from "lucide-react"; // アイコン追加
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TagsTable } from "@/components/molecules/TagsTable";
import { TagsDialog } from "@/components/molecules/TagsDialog";
import { TagsJson } from "@/components/molecules/TagsJson";

interface Props {
  userId: string;
}

export default function Tags({ userId }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const data = await getZstuTags(userId);
        setTags(data || []);
      } catch (error) {
        console.error(error);
        toast.error("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [userId]);

  // (handleUpdate, handleDragEnd, handleCreate, handleDelete は変更なしのため中略)
  const handleUpdate = async (id: number, data: Partial<Tag>) => {
    try {
      await updateZstuTag(id, data);
      toast.success("更新しました");
      setTags((prev) =>
        prev
          .map((t) =>
            t.id === id ? { ...t, ...data, updated_at: new Date() } : t,
          )
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      );
    } catch (error) {
      console.error(error);
      toast.error("更新に失敗しました");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // 現在の tags ステートを使用して計算
      const oldIndex = tags.findIndex((item) => item.id === active.id);
      const newIndex = tags.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(tags, oldIndex, newIndex);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        display_order: index + 1,
      }));

      const orderUpdates = updatedItems
        .filter((item) => {
          const original = tags.find((t) => t.id === item.id);
          return original
            ? original.display_order !== item.display_order
            : true;
        })
        .map((item) => ({ id: item.id, display_order: item.display_order }));

      setTags(updatedItems);

      if (orderUpdates.length > 0) {
        updateZstuTagsOrder(userId, orderUpdates)
          .then(() => toast.success("並び順を保存しました"))
          .catch(() => toast.error("並び順の保存に失敗しました"));
      }
    }
  };

  const handleCreate = async (tagData: Partial<Tag>) => {
    setIsCreating(true);
    try {
      const maxOrder = tags.reduce(
        (max, t) => Math.max(max, t.display_order || 0),
        0,
      );
      const tagToSubmit = { ...tagData, display_order: maxOrder + 1 };
      const created = await createZstuTag(userId, tagToSubmit);
      toast.success("タグを作成しました");
      setTags((prev) =>
        [...prev, created].sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0),
        ),
      );
      setIsCreateOpen(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (error) {
      toast.error("作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このタグを削除してもよろしいですか？")) return;
    try {
      await deleteZstuTag(id);
      toast.success("タグを削除しました");
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-1">タグ一覧</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 新規追加
        </Button>
      </header>

      {/* --- Tabsの導入 --- */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-4">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" /> テーブル
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <Code className="h-4 w-4" /> JSON出力
          </TabsTrigger>
        </TabsList>

        {/* テーブル表示コンテンツ */}
        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <TagsTable
                tags={tags}
                loading={loading}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onDragEnd={handleDragEnd}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* JSON表示コンテンツ */}
        <TabsContent value="json">
          <TagsJson userId={userId} />
        </TabsContent>
      </Tabs>

      <div ref={bottomRef} />

      <TagsDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
        isCreating={isCreating}
      />
    </div>
  );
}
