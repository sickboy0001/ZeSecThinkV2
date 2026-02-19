// src/components/molecules/TagsTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tag } from "@/services/zstutags_service";
import { GripVertical, Trash2, Loader2 } from "lucide-react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TagsTableProps {
  tags: Tag[];
  loading: boolean;
  onUpdate: (id: number, data: Partial<Tag>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDragEnd: (event: DragEndEvent) => void;
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
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex justify-center items-center h-full p-2 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
};

export function TagsTable({
  tags,
  loading,
  onUpdate,
  onDelete,
  onDragEnd,
}: TagsTableProps) {
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

  const handleBlur = (id: number, field: keyof Tag, value: any) => {
    const currentTag = tags.find((t) => t.id === id);
    if (!currentTag) return;

    const currentValue = currentTag[field];
    // 値が変わっていない場合は更新しない
    if (currentValue === value) return;

    onUpdate(id, { [field]: value });
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

    onUpdate(id, { aliases: newAliases });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      id="tags-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12.5"></TableHead>
            <TableHead>Tag Name</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Aliases</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Send AI</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead></TableHead>
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
                      className="w-20 border-none shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={tag.name || ""}
                      onBlur={(e) => handleBlur(tag.id, "name", e.target.value)}
                      className="min-w-30 border-none shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={tag.aliases?.join(", ") || ""}
                      onBlur={(e) => handleAliasesBlur(tag.id, e.target.value)}
                      className="min-w-37.5 border-none shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      defaultValue={tag.description || ""}
                      onBlur={(e) =>
                        handleBlur(tag.id, "description", e.target.value)
                      }
                      className="min-w-[300px] min-h-[60px] border-none shadow-none focus-visible:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={tag.is_active}
                        onCheckedChange={(c) =>
                          onUpdate(tag.id, { is_active: !!c })
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={tag.is_send_ai}
                        onCheckedChange={(c) =>
                          onUpdate(tag.id, { is_send_ai: !!c })
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(tag.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </SortableRow>
              ))}
            </SortableContext>
          )}
        </TableBody>
      </Table>
    </DndContext>
  );
}
