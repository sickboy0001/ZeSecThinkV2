"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getZstuTags,
  updateZstuTag,
  createZstuTag,
  Tag,
} from "@/services/zstutags_service";
import { toast } from "sonner";
import { Check, Loader2, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  userId: string;
}

interface SortableRowProps {
  tag: Tag;
  children: React.ReactNode;
}

const SortableRow = ({ tag, children }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? "relative" : undefined,
  } as React.CSSProperties;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isDragging ? "selected" : undefined}
      className={isDragging ? "bg-background" : ""}
    >
      {children}
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex justify-center items-center h-full p-2 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function Tags({ userId }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTag, setNewTag] = useState<Partial<Tag>>({
    tag_name: "",
    name: "",
    aliases: [],
    description: "",
    display_order: 0,
    is_active: true,
    is_send_ai: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleBlur = (id: number, field: keyof Tag, value: any) => {
    const currentTag = tags.find((t) => t.id === id);
    if (!currentTag) return;

    const currentValue = currentTag[field];
    if (typeof value === "number") {
      if (currentValue === value) return;
    } else if (typeof value === "string") {
      if ((currentValue || "") === value) return;
    } else {
      if (currentValue === value) return;
    }

    handleUpdate(id, { [field]: value });
  };

  const handleAliasesBlur = (id: number, value: string) => {
    const currentTag = tags.find((t) => t.id === id);
    if (!currentTag) return;

    const newAliases = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const currentAliases = currentTag.aliases || [];

    if (JSON.stringify(currentAliases) === JSON.stringify(newAliases)) return;

    handleUpdate(id, { aliases: newAliases });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTags((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          display_order: (index + 1) * 10,
        }));

        Promise.all(
          updatedItems.map((t) =>
            updateZstuTag(t.id, { display_order: t.display_order }),
          ),
        ).catch(() => toast.error("並び順の保存に失敗しました"));

        return updatedItems;
      });
    }
  };

  const handleCreate = async () => {
    if (!newTag.tag_name) {
      toast.error("Tag Nameは必須です");
      return;
    }
    setIsCreating(true);
    try {
      const created = await createZstuTag(userId, newTag);
      toast.success("タグを作成しました");
      setTags((prev) =>
        [...prev, created].sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0),
        ),
      );
      setIsCreateOpen(false);
      setNewTag({
        tag_name: "",
        name: "",
        aliases: [],
        description: "",
        display_order: 0,
        is_active: true,
        is_send_ai: true,
      });
    } catch (error) {
      console.error(error);
      toast.error("作成に失敗しました");
    } finally {
      setIsCreating(false);
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DndContext
              id="tags-dnd-context"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Aliases</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Send AI</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12.5">Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        データがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext
                      items={tags.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tags.map((tag) => (
                        <SortableRow key={tag.id} tag={tag}>
                          <TableCell>
                            <Input
                              defaultValue={tag.tag_name}
                              onBlur={(e) =>
                                handleBlur(tag.id, "tag_name", e.target.value)
                              }
                              className="min-w-30"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={tag.name || ""}
                              onBlur={(e) =>
                                handleBlur(tag.id, "name", e.target.value)
                              }
                              className="min-w-30"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={tag.aliases?.join(", ") || ""}
                              onBlur={(e) =>
                                handleAliasesBlur(tag.id, e.target.value)
                              }
                              className="min-w-37.5"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              defaultValue={tag.description || ""}
                              onBlur={(e) =>
                                handleBlur(
                                  tag.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="min-w-50"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={tag.is_active}
                                onCheckedChange={(c) =>
                                  handleUpdate(tag.id, { is_active: !!c })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={tag.is_send_ai}
                                onCheckedChange={(c) =>
                                  handleUpdate(tag.id, { is_send_ai: !!c })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {tag.updated_at
                              ? new Date(tag.updated_at).toLocaleString([], {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                        </SortableRow>
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                value={newTag.tag_name}
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
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="aliases" className="text-right">
                Aliases
              </Label>
              <Input
                id="aliases"
                value={newTag.aliases?.join(", ")}
                onChange={(e) =>
                  setNewTag({
                    ...newTag,
                    aliases: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
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
                value={newTag.description}
                onChange={(e) =>
                  setNewTag({ ...newTag, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display_order" className="text-right">
                Order
              </Label>
              <Input
                id="display_order"
                type="number"
                value={newTag.display_order}
                onChange={(e) =>
                  setNewTag({
                    ...newTag,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
