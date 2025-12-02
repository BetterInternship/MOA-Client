import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";

export type FormRow = {
  name: string;
  label?: string;
  autoSign: boolean;
};

export default function MyFormCard({
  row,
  isCoordinator,
  onPreview,
  onToggleAutoSign,
}: {
  row: FormRow;
  isCoordinator?: boolean;
  onPreview?: (name: string) => void;
  onToggleAutoSign?: (name: string, currentValue: boolean) => void;
}) {
  function toggle(name: string) {
    onToggleAutoSign?.(name, row.autoSign);
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-red-500">
      <Card key={row.name} className="flex-row items-center justify-between px-3">
        <div className="flex flex-col">
          <div className="line-clamp-1 text-sm leading-tight font-medium">{row.name}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-sign toggle control */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Authorize auto-sign</span>
                <Switch
                  checked={row.autoSign}
                  onCheckedChange={() => toggle(row.name)}
                  aria-label={`Toggle auto-sign for ${row.name}`}
                />
              </div>
            </Tooltip>
          </div>

          {/* Preview button for coordinators */}
          {isCoordinator && (
            <Button size="sm" onClick={() => onPreview?.(row.name)} className="h-8 px-3">
              Preview
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
