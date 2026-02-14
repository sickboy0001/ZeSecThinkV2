"use client";

import React, { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

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
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
        onChange(e);
      }}
      onBlur={onBlur}
      className={className}
      rows={1}
      {...props}
    />
  );
};
