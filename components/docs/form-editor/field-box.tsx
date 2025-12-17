"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type FormField = {
  field: string;
  label: string;
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
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected || !onDrag) return;
    e.stopPropagation();
    e.preventDefault();

    // Capture pointer to this element so we track events even if cursor goes off-screen
    if (boxRef.current && "setPointerCapture" in boxRef.current) {
      const pointerEvent = e.nativeEvent as PointerEvent;
      boxRef.current.setPointerCapture(pointerEvent.pointerId);
    }

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
    if (isDragging && onDragEnd) {
      onDragEnd();
    }
    if (isResizing && onResizeEnd) {
      onResizeEnd();
    }
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: "nw" | "ne" | "sw" | "se") => {
    if (!isSelected || !onResize) return;
    e.stopPropagation();
    e.preventDefault();

    // Capture pointer to this element
    if (boxRef.current && "setPointerCapture" in boxRef.current) {
      const pointerEvent = e.nativeEvent as PointerEvent;
      boxRef.current.setPointerCapture(pointerEvent.pointerId);
    }

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

  // Global document event listeners for drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart && onDrag) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        onDrag(deltaX, deltaY);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
      if (isResizing && resizeHandle && resizeStart && onResize) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        onResize(resizeHandle, deltaX, deltaY);
        setResizeStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, isResizing, resizeHandle, resizeStart, onDrag, onResize]);

  return (
    <div
      ref={boxRef}
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
      onMouseLeave={() => {
        // Don't clear drag/resize on mouse leave during active drag/resize
        if (!isDragging && !isResizing) {
          handleMouseUp();
        }
      }}
      role="button"
      tabIndex={0}
      title={field.label}
      style={{
        cursor: isDragging ? "grabbing" : isResizing ? "grabbing" : isSelected ? "grab" : "pointer",
      }}
    >
      <div className="text-muted-foreground pointer-events-none px-1 py-0.5 text-xs font-semibold">
        {field.label}
      </div>

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Corner handles - bigger and easier to grab */}
          <div
            className="bg-primary absolute -top-2 -left-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleResizeStart(e, "nw");
            }}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -top-2 -right-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleResizeStart(e, "ne");
            }}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -bottom-2 -left-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleResizeStart(e, "sw");
            }}
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="bg-primary absolute -right-2 -bottom-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleResizeStart(e, "se");
            }}
            style={{ pointerEvents: "auto" }}
          />
        </>
      )}
    </div>
  );
};
