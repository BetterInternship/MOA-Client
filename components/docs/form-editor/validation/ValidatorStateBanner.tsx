import type { ValidationImportState } from "@/lib/validation-legacy";

export function ValidatorStateBanner({
  importState,
  mode,
  onSwitchRaw,
  onReplace,
}: {
  importState: ValidationImportState;
  mode: "simple" | "raw";
  onSwitchRaw: () => void;
  onReplace: () => void;
}) {
  if (importState.status === "exact") return null;

  if (importState.status === "partial") {
    return (
      <div className="rounded-[0.33em] border border-amber-200 bg-amber-50 p-2">
        <p className="text-xs text-amber-900">
          Some advanced validation rules cannot be edited here. Editing no-code validators may
          replace them.
        </p>
        <div className="mt-1 flex gap-2">
          {mode !== "raw" && (
            <button
              type="button"
              onClick={onSwitchRaw}
              className="text-xs text-amber-900 underline-offset-2 hover:underline"
            >
              Switch to Raw
            </button>
          )}
          <button
            type="button"
            onClick={onReplace}
            className="text-xs text-amber-900 underline-offset-2 hover:underline"
          >
            Replace with simple validators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[0.33em] border border-slate-200 bg-slate-50 p-2">
      <p className="text-xs text-slate-700">This field uses advanced validation.</p>
      <div className="mt-1 flex gap-2">
        {mode !== "raw" && (
          <button
            type="button"
            onClick={onSwitchRaw}
            className="text-xs text-slate-700 underline-offset-2 hover:underline"
          >
            Edit raw validator
          </button>
        )}
        <button
          type="button"
          onClick={onReplace}
          className="text-xs text-slate-700 underline-offset-2 hover:underline"
        >
          Replace with simple validators
        </button>
      </div>
    </div>
  );
}
