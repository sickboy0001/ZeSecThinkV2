"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/atoms/AutoResizeTextarea";

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  isTextarea?: boolean;
  className?: string;
}

export const LogEditableCell = ({
  value,
  onSave,
  isTextarea = false,
  className,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onSave(localValue);
  };

  if (isEditing) {
    return isTextarea ? (
      <AutoResizeTextarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`min-h-[60px] w-full p-2 text-sm ${className}`}
        autoFocus
      />
    ) : (
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && handleBlur()}
        className={`h-8 w-full ${className}`}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px] ${className}`}
    >
      {value || (
        <span className="text-muted-foreground opacity-50 text-xs">Empty</span>
      )}
    </div>
  );
};
