import { useEffect, useMemo, useState } from "react";
import { parsePrefillerToCompactState } from "@/lib/default-value-builder";
import { validateExpression } from "@/lib/expression-validator";

type UseDefaultValueModelInput = {
  source: string;
  prefiller: string;
};

export function useDefaultValueModel({ source, prefiller }: UseDefaultValueModelInput) {
  const [mode, setMode] = useState<"simple" | "raw">("simple");
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parsePrefillerToCompactState(prefiller || ""), [prefiller]);
  const advancedValidation = useMemo(() => validateExpression(prefiller || ""), [prefiller]);
  const [manualValue, setManualValue] = useState("");
  const isLocked = source === "auto";

  useEffect(() => {
    if (parsed.kind === "manual") setManualValue(parsed.manualValue);
    if (parsed.kind === "empty") setManualValue("");
  }, [parsed.kind, parsed.manualValue]);

  return {
    mode,
    setMode,
    open,
    setOpen,
    parsed,
    manualValue,
    setManualValue,
    advancedValidation,
    isLocked,
  };
}

