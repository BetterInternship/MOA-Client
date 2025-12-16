"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export type FormField = {
  field: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FieldBoxProps = {
  field: FormField;
  isSelected?: boolean;
  onSelect?: () => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onResize?: (handle: "nw" | "ne" | "sw" | "se", deltaX: number, deltaY: number) => void;
};

export const FieldBox = ({ field, isSelected, onSelect, onDrag, onResize }: FieldBoxProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected || !onDrag) return;
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !onDrag) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    onDrag(deltaX, deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: "nw" | "ne" | "sw" | "se") => {
    if (!isSelected || !onResize) return;
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !resizeHandle || !resizeStart || !onResize) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    onResize(resizeHandle, deltaX, deltaY);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className={cn(
        "group absolute inset-0 border-2 transition-colors",
        isSelected ? "border-primary bg-primary/20" : "border-amber-500/50 bg-amber-500/15",
        isDragging && "bg-primary/30"
      )}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleResizeMove(e);
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      role="button"
      tabIndex={0}
      title={field.field}
      style={{
        cursor: isDragging ? "grabbing" : isResizing ? "default" : isSelected ? "grab" : "pointer",
      }}
    >
      <div className="text-muted-foreground pointer-events-none px-1 py-0.5 text-xs font-semibold">
        {field.field}
      </div>

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div
            className="bg-primary absolute -top-1.5 -left-1.5 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="bg-primary absolute -top-1.5 -right-1.5 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="bg-primary absolute -bottom-1.5 -left-1.5 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="bg-primary absolute -right-1.5 -bottom-1.5 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
        </>
      )}
    </div>
  );
};
