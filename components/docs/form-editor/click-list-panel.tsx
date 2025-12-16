"use client";

import type { PointerLocation } from "./pdf-viewer";

type ClickListPanelProps = {
  clickHistory: PointerLocation[];
};

export const ClickListPanel = ({ clickHistory }: ClickListPanelProps) => {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-xs font-semibold">
        Click History ({clickHistory.length})
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {clickHistory.length === 0 ? (
          <div className="border-muted-foreground/30 bg-muted/30 text-muted-foreground rounded border border-dashed p-3 text-center text-xs">
            Click locations will appear here
          </div>
        ) : (
          clickHistory.map((click, idx) => (
            <div
              key={idx}
              className="rounded bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700"
            >
              <div className="flex justify-between">
                <span>p{click.page}</span>
                <span className="tabular-nums">
                  {click.x.toFixed(1)}, {click.y.toFixed(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
