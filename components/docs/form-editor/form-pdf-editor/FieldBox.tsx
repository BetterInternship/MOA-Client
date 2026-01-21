"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type FormField = {
  id: string;
  _id?: string;
  field: string;
  label: string;
  type: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  align_h?: "left" | "center" | "right";
  align_v?: "top" | "middle" | "bottom";
  size?: number;
  wrap?: boolean;
};

export type FieldBoxProps = {
  field: FormField;
  isSelected?: boolean;
  onSelect?: () => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void;
  onResize?: (handle: "nw" | "ne" | "sw" | "se", deltaX: number, deltaY: number) => void;
  onResizeEnd?: () => void;
};

export const FieldBox = ({
  field,
  isSelected,
  onSelect,
  onDrag,
  onDragEnd,
  onResize,
  onResizeEnd,
}: FieldBoxProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragState = useRef<{ startX: number; startY: number } | null>(null);
  const resizeState = useRef<{
    startX: number;
    startY: number;
    handle: "nw" | "ne" | "sw" | "se";
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected && onSelect) {
      onSelect();
    }

    e.stopPropagation();
    e.preventDefault();

    dragState.current = { startX: e.clientX, startY: e.clientY };
    setIsDragging(true);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragState.current || !onDrag) return;

      const deltaX = moveEvent.clientX - dragState.current.startX;
      const deltaY = moveEvent.clientY - dragState.current.startY;

      onDrag(deltaX, deltaY);
    };

    const handleUp = () => {
      dragState.current = null;
      setIsDragging(false);
      onDragEnd?.();
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: "nw" | "ne" | "sw" | "se") => {
    if (!isSelected && onSelect) {
      onSelect();
    }

    e.stopPropagation();
    e.preventDefault();

    resizeState.current = { startX: e.clientX, startY: e.clientY, handle };
    setIsResizing(true);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!resizeState.current || !onResize) return;

      const deltaX = moveEvent.clientX - resizeState.current.startX;
      const deltaY = moveEvent.clientY - resizeState.current.startY;

      onResize(resizeState.current.handle, deltaX, deltaY);
    };

    const handleUp = () => {
      resizeState.current = null;
      setIsResizing(false);
      onResizeEnd?.();
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  return (
    <div
      className={cn(
        "group absolute inset-0 border transition-colors",
        isSelected ? "border-primary bg-primary/20" : "border-amber-400 bg-amber-400/15",
        isDragging && "bg-primary/30"
      )}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      title={field.label}
      style={{
        cursor: isDragging ? "grabbing" : isResizing ? "grabbing" : isSelected ? "grab" : "pointer",
      }}
    >
      <div
        className="text-muted-foreground pointer-events-none overflow-hidden font-semibold"
        style={{
          fontSize: `clamp(7px, ${Math.min(field.h * 0.75, 16)}px, 12px)`,
          lineHeight: 1.2,
          wordWrap: "break-word",
          whiteSpace: "normal",
          padding: "2px 2px",
        }}
      >
        {field.label}
      </div>

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          <div
            className="bg-primary absolute -top-2 -left-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -top-2 -right-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -bottom-2 -left-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -right-2 -bottom-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            style={{ pointerEvents: "auto" }}
          />
        </>
      )}
    </div>
  );
};
