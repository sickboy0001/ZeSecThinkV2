"use client";

import React, { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const AutoResizeTextarea = ({
  value,
  onChange,
  onBlur,
  className,
  ...props
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className?: string;
  [key: string]: any;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 一旦高さをautoにしてからscrollHeightを取得することで縮む方向のリサイズにも対応
      textarea.style.height = "auto";
      const borderHeight = textarea.offsetHeight - textarea.clientHeight;
      // scrollHeightのみで十分な場合もあるので、余分な高さを抑える
      textarea.style.height = `${textarea.scrollHeight + (borderHeight > 0 ? borderHeight : 0)}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    // onChange時にも即座に高さを反映する
    textarea.style.height = "auto";
    const borderHeight = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + (borderHeight > 0 ? borderHeight : 0)}px`;
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      className={cn(
        "focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors resize-none overflow-hidden",
        className,
      )}
      rows={1}
      {...props}
    />
  );
};
