/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:54:43
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:52:44
 * @ Description: Component displaying details of the selected field with actions
 */

import type { FormField } from "./pdf-viewer";

type SelectedFieldDetailsProps = {
  field: FormField;
  fieldId: string;
  onDuplicate: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
};

export const SelectedFieldDetails = ({
  field,
  fieldId,
  onDuplicate,
  onDelete,
}: SelectedFieldDetailsProps) => {
  return (
    <div className="border-primary/30 bg-primary/5 space-y-3 rounded-[0.33em] border p-3 text-xs">
      <div className="">
        <div className="text-primary font-semibold">{field.field} </div>
        <span className="font-medium">Page:</span> {field.page}
      </div>

      {/* Coordinates Grid */}
      <div className="text-muted-foreground grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium">X:</span> {field.x.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">Y:</span> {field.y.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">W:</span> {field.w.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">H:</span> {field.h.toFixed(1)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onDuplicate(fieldId)}
          className="h-8 flex-1 rounded bg-slate-200 px-2 text-xs font-medium transition-colors hover:bg-slate-300"
        >
          Duplicate
        </button>
        <button
          onClick={() => onDelete(fieldId)}
          className="h-8 flex-1 rounded bg-red-100 px-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
