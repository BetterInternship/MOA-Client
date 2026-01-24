"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getPartyColorByIndex } from "@/lib/party-colors";

export type FormField = {
  id: string;
  field: string;
  label: string;
  tooltip_label?: string;
  type: "text" | "signature" | "image";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isPhantom?: boolean;
  signing_party_order?: number;
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
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const resizeState = useRef<{
    startX: number;
    startY: number;
    handle: "nw" | "ne" | "sw" | "se";
  } | null>(null);

  const partyOrder = field.signing_party_order || 1;
  const colorIndex = partyOrder - 1;
  const partyColor = getPartyColorByIndex(colorIndex);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected && onSelect) {
      onSelect();
    }

    e.stopPropagation();
    e.preventDefault();

    dragState.current = { startX: e.clientX, startY: e.clientY };
    dragOffsetRef.current = { x: 0, y: 0 };
    setIsDragging(true);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragState.current || !elementRef.current) return;

      const deltaX = moveEvent.clientX - dragState.current.startX;
      const deltaY = moveEvent.clientY - dragState.current.startY;

      // Update visual offset using ref (no re-render)
      dragOffsetRef.current = { x: deltaX, y: deltaY };
      elementRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleUp = () => {
      // Only call onDrag once at the end with the final delta
      if (onDrag && dragState.current) {
        onDrag(dragOffsetRef.current.x, dragOffsetRef.current.y);
      }
      dragState.current = null;
      setIsDragging(false);

      if (elementRef.current) {
        elementRef.current.style.transform = "";
      }
      dragOffsetRef.current = { x: 0, y: 0 };

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
      ref={elementRef}
      className={cn("group absolute inset-0 border transition-colors")}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      title={field.label}
      style={{
        borderColor: partyColor.hex,
        borderStyle: "solid",
        borderWidth: "2px",
        backgroundColor: isSelected ? partyColor.hex + "50" : partyColor.hex + "75",
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
            className="absolute -top-2 -left-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
            style={{
              backgroundColor: partyColor.hex,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute -top-2 -right-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
            style={{
              backgroundColor: partyColor.hex,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute -bottom-2 -left-2 hidden h-3 w-3 cursor-nesw-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
            style={{
              backgroundColor: partyColor.hex,
              pointerEvents: "auto",
            }}
          />
          <div
            className="absolute -right-2 -bottom-2 hidden h-3 w-3 cursor-nwse-resize rounded-full group-hover:block"
            onMouseDown={(e) => handleResizeStart(e, "se")}
            style={{
              backgroundColor: partyColor.hex,
              pointerEvents: "auto",
            }}
          />
        </>
      )}
    </div>
  );
};
