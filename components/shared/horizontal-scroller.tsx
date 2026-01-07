"use client";

import { useRef, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalScrollerProps {
  children: ReactNode;
  className?: string;
  showArrows?: boolean;
}

export function HorizontalScroller({
  children,
  className = "",
  showArrows = true,
}: HorizontalScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative flex items-center">
      {showArrows && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-r from-white to-transparent transition-colors hover:from-gray-50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className={cn(
          "scrollbar-hide flex w-full flex-row gap-2 overflow-x-auto",
          showArrows && "px-8",
          className
        )}
      >
        {children}
      </div>

      {showArrows && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-l from-white to-transparent transition-colors hover:from-gray-50"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}
