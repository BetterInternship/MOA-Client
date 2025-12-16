/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:56
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 21:10:53
 * @ Description: Dashed preview box shown during placement
 */

"use client";

type GhostFieldProps = {
  displayX: number;
  displayY: number;
  width: number;
  height: number;
  fieldType: string;
};

export const GhostField = ({ displayX, displayY, width, height, fieldType }: GhostFieldProps) => {
  return (
    <div
      className="border-primary/50 bg-primary/10 pointer-events-none absolute border-2 border-dashed"
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      title={`Preview: ${fieldType}`}
    >
      <div className="text-muted-foreground px-1 py-0.5 text-xs font-semibold opacity-60">
        {fieldType}
      </div>
    </div>
  );
};
