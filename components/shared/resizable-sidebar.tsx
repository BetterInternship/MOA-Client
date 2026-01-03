"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface ResizableSidebarProps {
  items: SidebarMenuItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  isResizable?: boolean;
}

export const ResizableSidebar = ({
  items,
  activeItem,
  onItemChange,
  minWidth = 150,
  maxWidth = 400,
  defaultWidth = 208,
  isResizable = true,
}: ResizableSidebarProps) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizable) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth > minWidth && newWidth < maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "auto";
    };
  }, [isResizing, isResizable, minWidth, maxWidth]);

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className="relative flex flex-shrink-0 flex-col overflow-y-auto border-r bg-slate-50 transition-none"
      >
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemChange(item.id)}
              className={`w-full rounded-[0.33em] px-3 py-2.5 text-left transition-all ${
                activeItem === item.id
                  ? "bg-blue-100 shadow-xs"
                  : "text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={activeItem === item.id ? "text-primary" : "text-slate-500"}>
                  {item.icon}
                </span>
                <div className="flex-1 overflow-hidden">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      activeItem === item.id && "font-semibold"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Resize Handle */}
      {isResizable && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="w-1 flex-shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-blue-400"
          title="Drag to resize"
        />
      )}
    </>
  );
};
