import { useEffect, useMemo, useRef, useState } from "react";
import {
  createValidatorRule,
  type ValidatorConfig,
  zodCodeToValidatorConfig,
} from "@/lib/validator-engine";
import {
  getAllowedRules,
  persistedIRToValidatorConfig,
  persistedIRToZod,
  validatorConfigToPersistedIR,
  type ValidatorIRv0,
} from "@/lib/validator-ir";
import { deriveValidatorBaseType } from "@/lib/validation-base-type";
import { resolveValidationImportState } from "@/lib/validation-legacy";

type NextValidationValue = { validator: string; validator_ir: ValidatorIRv0 | null };

type UseValidationModelInput = {
  schemaType?: string;
  validator: string;
  validatorIr?: ValidatorIRv0 | null;
  onChange: (next: NextValidationValue) => void;
};

/**
 * Central orchestration layer for validation editing.
 * - Resolves base type and import mode from `{ validator, validator_ir }`.
 * - Keeps simple mode IR-canonical (compiled Zod must match IR).
 * - Handles raw mode as direct Zod editing (`validator_ir = null`).
 */
export function useValidationModel({
  schemaType,
  validator,
  validatorIr,
  onChange,
}: UseValidationModelInput) {
  const validatorCode = validator || "";
  const baseType = useMemo(
    () => deriveValidatorBaseType(schemaType, validatorCode, validatorIr),
    [schemaType, validatorCode, validatorIr]
  );

  const importState = useMemo(
    () => resolveValidationImportState(validatorCode, baseType, validatorIr),
    [validatorCode, baseType, validatorIr]
  );

  const parsedConfig = useMemo(() => {
    if (importState.ir) return persistedIRToValidatorConfig(importState.ir);
    try {
      return zodCodeToValidatorConfig(validatorCode);
    } catch {
      return { rules: [] };
    }
  }, [importState, validatorCode]);

  const hasRawValidator = Boolean(validatorCode.trim());
  const shouldAutoConvert =
    !validatorIr && hasRawValidator && (importState.status === "partial" || importState.status === "custom");
  const isHardCustom = shouldAutoConvert && parsedConfig.rules.length === 0;
  const autoConverted = shouldAutoConvert && !isHardCustom;

  const [mode, setMode] = useState<"simple" | "raw">(
    importState.status === "custom" && isHardCustom ? "raw" : "simple"
  );
  const [config, setConfig] = useState<ValidatorConfig>(parsedConfig);
  const autoConvertKeyRef = useRef<string | null>(null);
  const irCanonicalSyncKeyRef = useRef<string | null>(null);
  const seedPlainTextKeyRef = useRef<string | null>(null);
  const debugSourceKeyRef = useRef<string | null>(null);
  const debugPayloadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setConfig(parsedConfig);
  }, [parsedConfig]);

  useEffect(() => {
    setMode(importState.status === "custom" && isHardCustom ? "raw" : "simple");
  }, [importState.status, isHardCustom]);

  useEffect(() => {
    if (!autoConverted) {
      autoConvertKeyRef.current = null;
      return;
    }

    const autoConvertKey = `${baseType}::${validatorCode}`;
    if (autoConvertKeyRef.current === autoConvertKey) return;
    autoConvertKeyRef.current = autoConvertKey;

    const ir = validatorConfigToPersistedIR(parsedConfig, baseType, {
      mode: "builder",
      importStatus: "exact",
    });
    onChange({ validator: persistedIRToZod(ir), validator_ir: ir });
  }, [autoConverted, baseType, parsedConfig, onChange, validatorCode]);

  // Seed new blank text fields with plain-text validation so emojis are blocked by default.
  useEffect(() => {
    if (mode !== "simple" || baseType !== "text") {
      seedPlainTextKeyRef.current = null;
      return;
    }
    if (validatorIr || validatorCode.trim() || config.rules.length > 0) {
      seedPlainTextKeyRef.current = null;
      return;
    }

    const seedKey = `${schemaType || "unknown"}::${baseType}`;
    if (seedPlainTextKeyRef.current === seedKey) return;
    seedPlainTextKeyRef.current = seedKey;

    const nextConfig: ValidatorConfig = { rules: [createValidatorRule("plainText")] };
    setConfig(nextConfig);
    const ir = validatorConfigToPersistedIR(nextConfig, baseType, {
      mode: "builder",
      importStatus: "exact",
    });
    onChange({ validator: persistedIRToZod(ir), validator_ir: ir });
  }, [mode, baseType, validatorIr, validatorCode, config.rules.length, schemaType, onChange]);

  // Keep IR canonical in simple mode: if backend validator diverges from IR, recompile from IR.
  useEffect(() => {
    if (mode !== "simple") {
      irCanonicalSyncKeyRef.current = null;
      return;
    }
    if (!importState.ir) {
      irCanonicalSyncKeyRef.current = null;
      return;
    }

    let effectiveIr = importState.ir;
    const rules = Array.isArray((importState.ir as any).rules) ? ([...(importState.ir as any).rules] as any[]) : [];
    const titleCaseInRaw =
      /toLocaleUpperCase\(\)\s*\+\s*\w+\.slice\(1\)\.toLocaleLowerCase\(\)\s*===\s*\w+/i.test(
        validatorCode
      ) || /title case/i.test(validatorCode);
    const hasPlainText = rules.some((rule) => rule?.kind === "plainText");
    const hasTitleCase = rules.some((rule) => rule?.kind === "titleCase");
    if (baseType === "text" && titleCaseInRaw && hasPlainText && !hasTitleCase) {
      effectiveIr = {
        ...(importState.ir as any),
        rules: [...rules, { kind: "titleCase" }],
        mode: (importState.ir as any).mode || "builder",
        importStatus: (importState.ir as any).importStatus || "exact",
      } as ValidatorIRv0;
    }

    const compiledValidator = persistedIRToZod(effectiveIr);
    if (compiledValidator === validatorCode) {
      irCanonicalSyncKeyRef.current = null;
      return;
    }

    const syncKey = `${baseType}::${validatorCode}::${compiledValidator}`;
    if (irCanonicalSyncKeyRef.current === syncKey) return;
    irCanonicalSyncKeyRef.current = syncKey;

    onChange({
      validator: compiledValidator,
      validator_ir: effectiveIr,
    });
  }, [mode, importState.ir, validatorCode, baseType, onChange]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const source =
      validatorIr && importState.ir
        ? "UI(IR)"
        : autoConverted
          ? "ZOD(auto-converted)"
          : "ZOD";
    const key = `${source}|${importState.status}|${baseType}`;
    if (debugSourceKeyRef.current === key) return;
    debugSourceKeyRef.current = key;
    console.info(
      `[ValidationSource] source=${source} status=${importState.status} baseType=${baseType}`
    );
  }, [autoConverted, baseType, importState.ir, importState.status, validatorIr]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const payloadKey = `${schemaType || "unknown"}|${baseType}|${importState.status}|${validatorCode}`;
    if (debugPayloadKeyRef.current === payloadKey) return;
    debugPayloadKeyRef.current = payloadKey;

    console.groupCollapsed("[ValidationPayload] opened/updated");
    console.log("schemaType:", schemaType ?? "(none)");
    console.log("baseType:", baseType);
    console.log("importStatus:", importState.status);
    console.log("validator_from_backend:", validatorCode);
    console.log("validator_ir_from_backend:", validatorIr ?? null);
    console.log("parsed_config_rules:", parsedConfig.rules);
    console.log("resolved_ir:", importState.ir ?? null);
    console.groupEnd();
  }, [schemaType, baseType, importState.status, importState.ir, parsedConfig.rules, validatorCode, validatorIr]);

  const isReadOnlyLegacy = importState.status === "custom" && isHardCustom;
  const allowedRuleTypes = useMemo(() => getAllowedRules(baseType), [baseType]);

  // All simple-mode edits compile immediately to Zod and emit both IR + validator.
  const onConfigChange = (nextConfig: ValidatorConfig) => {
    if (isReadOnlyLegacy) return;
    setConfig(nextConfig);
    const ir = validatorConfigToPersistedIR(nextConfig, baseType, {
      mode: "builder",
      importStatus: "exact",
    });
    onChange({ validator: persistedIRToZod(ir), validator_ir: ir });
  };

  // Raw mode is intentionally passthrough and clears IR as the source of truth.
  const onRawChange = (code: string) => {
    onChange({ validator: code, validator_ir: null });
  };

  // Converts legacy/custom payloads into a clean simple-model IR snapshot.
  const replaceWithSimpleRules = () => {
    const ir = validatorConfigToPersistedIR(parsedConfig, baseType, {
      mode: "builder",
      importStatus: "exact",
    });
    const nextConfig = persistedIRToValidatorConfig(ir);
    setConfig(nextConfig);
    onChange({ validator: persistedIRToZod(ir), validator_ir: ir });
    setMode("simple");
  };

  return {
    baseType,
    mode,
    setMode,
    config,
    importState,
    isReadOnlyLegacy,
    allowedRuleTypes,
    onConfigChange,
    onRawChange,
    replaceWithSimpleRules,
  };
}
