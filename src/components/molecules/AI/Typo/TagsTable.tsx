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
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tag } from "@/services/zstutags_service";
import { GripVertical, Trash2, Loader2, Calendar } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
  onDragEnd: (event: any) => void;
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

const SortableCard = ({
  tag,
  onUpdate,
  onDelete,
  handleBlur,
  handleAliasesBlur,
}: {
  tag: Tag;
  onUpdate: (id: number, data: Partial<Tag>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  handleBlur: (id: number, field: keyof Tag, value: any) => void;
  handleAliasesBlur: (id: number, value: string) => void;
}) => {
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
    zIndex: isDragging ? 10 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className="mb-2 last:mb-0">
      <Card
        className={`${isDragging ? "border-primary shadow-lg" : ""} transition-shadow`}
      >
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-none">
              <div className="flex items-center p-3 gap-2">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab p-2 hover:bg-muted rounded touch-none shrink-0"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-wrap">
                      <span className="font-bold break-all">
                        {tag.tag_name}
                      </span>
                      {tag.name && (
                        <span className="text-xs text-muted-foreground break-all mr-2">
                          ({tag.name})
                        </span>
                      )}
                      <AccordionTrigger className="p-0 h-auto w-auto hover:no-underline border-none data-[state=open]:rotate-180 transition-transform">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          詳細を表示
                        </span>
                      </AccordionTrigger>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Checkbox
                        checked={tag.is_active}
                        onCheckedChange={(c) =>
                          onUpdate(tag.id, { is_active: !!c })
                        }
                        className="h-4 w-4"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(tag.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <AccordionContent className="px-3 pt-0 space-y-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Tag Name
                    </label>
                    <Input
                      defaultValue={tag.tag_name}
                      onBlur={(e) =>
                        handleBlur(tag.id, "tag_name", e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Name
                    </label>
                    <Input
                      defaultValue={tag.name || ""}
                      onBlur={(e) => handleBlur(tag.id, "name", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Aliases
                  </label>
                  <Input
                    defaultValue={tag.aliases?.join(", ") || ""}
                    onBlur={(e) => handleAliasesBlur(tag.id, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Description
                  </label>
                  <Textarea
                    defaultValue={tag.description || ""}
                    onBlur={(e) =>
                      handleBlur(tag.id, "description", e.target.value)
                    }
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`send-ai-${tag.id}`}
                      checked={tag.is_send_ai}
                      onCheckedChange={(c) =>
                        onUpdate(tag.id, { is_send_ai: !!c })
                      }
                    />
                    <label htmlFor={`send-ai-${tag.id}`} className="text-xs">
                      Send AI
                    </label>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {tag.updated_at
                      ? new Date(tag.updated_at).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
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
      <SortableContext
        items={tags.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* Mobile View: Card Layout with Accordion */}
        <div className="block md:hidden p-2 space-y-2">
          {tags.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              データがありません
            </p>
          ) : (
            tags.map((tag) => (
              <SortableCard
                key={tag.id}
                tag={tag}
                onUpdate={onUpdate}
                onDelete={onDelete}
                handleBlur={handleBlur}
                handleAliasesBlur={handleAliasesBlur}
              />
            ))
          )}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block">
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
                tags.map((tag) => (
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
                        onBlur={(e) =>
                          handleBlur(tag.id, "name", e.target.value)
                        }
                        className="min-w-30 border-none shadow-none focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={tag.aliases?.join(", ") || ""}
                        onBlur={(e) =>
                          handleAliasesBlur(tag.id, e.target.value)
                        }
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SortableContext>
    </DndContext>
  );
}
