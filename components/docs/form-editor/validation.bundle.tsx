"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, X } from "lucide-react";
import {
  createValidatorRule,
  getAvailableRules,
  getRuleDefinition,
  type ValidatorConfig,
  type ValidatorRule,
  type ValidatorRuleType,
} from "@/lib/validator-engine";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { useValidationModel } from "@/hooks/useValidationModel";

interface ValidationAddRuleMenuProps {
  config: ValidatorConfig;
  allowedRuleTypes: ValidatorRuleType[];
  onConfigChange: (next: ValidatorConfig) => void;
  readOnly?: boolean;
}

export function ValidationAddRuleMenu({
  config,
  allowedRuleTypes,
  onConfigChange,
  readOnly = false,
}: ValidationAddRuleMenuProps) {
  const available = getAvailableRules().filter((rule) => allowedRuleTypes.includes(rule.type));

  const addRule = (ruleType: ValidatorRuleType) => {
    if (readOnly) return;
    const newRule = createValidatorRule(ruleType);
    let rules = [...config.rules];
    if (ruleType === "array") rules = rules.filter((rule) => rule.type !== "enum");
    if (ruleType === "enum") rules = rules.filter((rule) => rule.type !== "array");
    onConfigChange({ ...config, rules: [...rules, newRule] });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={readOnly}
          className="h-7 rounded-[0.33em] border-dashed text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add rule
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="z-[1200] max-h-64 w-56 overflow-auto rounded-[0.33em]"
      >
        {available.map((rule) => (
          <DropdownMenuItem key={rule.type} onClick={() => addRule(rule.type)}>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{rule.label}</span>
              <span className="text-[11px] text-slate-500">{rule.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ValidationRuleChipsProps {
  config: ValidatorConfig;
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onRemoveRule: (ruleId: string) => void;
  readOnly?: boolean;
  hiddenRuleTypes?: ValidatorRuleType[];
}

export function ValidationRuleChips({
  config,
  selectedRuleId,
  onSelectRule,
  onRemoveRule,
  readOnly = false,
  hiddenRuleTypes = [],
}: ValidationRuleChipsProps) {
  const visibleRules = config.rules.filter((rule) => !hiddenRuleTypes.includes(rule.type));
  if (!visibleRules.length) return <p className="text-xs text-slate-500">Add a rule</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleRules.map((rule) => {
        const label = getRuleDefinition(rule.type)?.label || rule.type;
        const isSelected = selectedRuleId === rule.id;
        return (
          <button
            key={rule.id}
            type="button"
            onClick={() => onSelectRule(rule.id)}
            className={`inline-flex items-center gap-1 rounded-[0.33em] border px-2 py-1 text-xs ${
              isSelected
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>{label}</span>
            {!readOnly && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRule(rule.id);
                }}
                className="rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface ValidationRuleEditorProps {
  config: ValidatorConfig;
  selectedRuleId: string | null;
  onConfigChange: (next: ValidatorConfig) => void;
  readOnly?: boolean;
}

function updateRule(config: ValidatorConfig, ruleId: string, updates: Partial<ValidatorRule>): ValidatorConfig {
  return {
    ...config,
    rules: config.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
  };
}

export function ValidationRuleEditor({
  config,
  selectedRuleId,
  onConfigChange,
  readOnly = false,
}: ValidationRuleEditorProps) {
  const rule = config.rules.find((item) => item.id === selectedRuleId) || null;
  if (!rule) return null;
  const definition = getRuleDefinition(rule.type);
  if (!definition) return null;

  const setParams = (params: ValidatorRule["params"]) => {
    if (readOnly) return;
    onConfigChange(updateRule(config, rule.id, { params }));
  };

  const value = rule.params?.value;
  const message = String(rule.params?.message || "");

  return (
    <div className="space-y-2 rounded-[0.33em] border border-slate-200 bg-white p-2">
      <p className="text-xs font-semibold text-slate-700">{definition.label}</p>

      {(rule.type === "enum" || rule.type === "array") && (
        <Textarea
          value={Array.isArray(value) ? value.join("\n") : ""}
          onChange={(e) => {
            const options = e.target.value
              .split("\n")
              .map((option) => option.trim())
              .filter(Boolean);
            setParams({ ...rule.params, value: options });
          }}
          placeholder="One option per line"
          disabled={readOnly}
          className="min-h-20 text-xs"
        />
      )}

      {definition.needsValue && rule.type !== "enum" && rule.type !== "array" && (
        <Input
          value={String(value ?? "")}
          onChange={(e) => {
            const nextValue = definition.valueType === "number" ? Number(e.target.value) : e.target.value;
            setParams({ ...rule.params, value: nextValue });
          }}
          placeholder={definition.valueType === "number" ? "Enter number" : "Enter value"}
          disabled={readOnly}
          className="h-8 text-xs"
        />
      )}

      {rule.type === "array" && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={String(rule.params?.minItems ?? "")}
            onChange={(e) =>
              setParams({ ...rule.params, minItems: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Min items"
            disabled={readOnly}
            className="h-8 text-xs"
          />
          <Input
            type="number"
            value={String(rule.params?.maxItems ?? "")}
            onChange={(e) =>
              setParams({ ...rule.params, maxItems: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Max items"
            disabled={readOnly}
            className="h-8 text-xs"
          />
        </div>
      )}

      <Input
        value={message}
        onChange={(e) => setParams({ ...rule.params, message: e.target.value })}
        placeholder="Error message (optional)"
        disabled={readOnly}
        className="h-8 text-xs"
      />
    </div>
  );
}

interface ValidationRawEditorProps {
  value: string;
  onChange: (code: string) => void;
}

export function ValidationRawEditor({ value, onChange }: ValidationRawEditorProps) {
  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='z.preprocess((v) => ((v ?? null) == null ? "" : (typeof v === "string" ? v.trim() : v)), z.string())'
        className="min-h-24 font-mono text-xs"
      />
      <p className="text-xs text-slate-500">Raw Zod expression</p>
    </div>
  );
}

interface ValidationLegacyNoticeProps {
  visible: boolean;
  onReplace: () => void;
}

export function ValidationLegacyNotice({ visible, onReplace }: ValidationLegacyNoticeProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      className="rounded-[0.33em] border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
      onClick={onReplace}
    >
      Replace with simple rules
    </button>
  );
}

interface ValidationSectionProps {
  title?: string;
  schemaType?: string;
  validator: string;
  validatorIr?: ValidatorIRv0 | null;
  onChange: (next: { validator: string; validator_ir: ValidatorIRv0 | null }) => void;
}

export function ValidationSection({
  title = "Validation",
  schemaType,
  validator,
  validatorIr,
  onChange,
}: ValidationSectionProps) {
  const {
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
  } = useValidationModel({
    schemaType,
    validator,
    validatorIr,
    onChange,
  });

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const hiddenRuleTypes = useMemo<ValidatorRuleType[]>(
    () => (baseType === "text" ? ["email", "url"] : []),
    [baseType]
  );
  const visibleRules = useMemo(
    () => config.rules.filter((rule) => !hiddenRuleTypes.includes(rule.type)),
    [config.rules, hiddenRuleTypes]
  );
  const menuAllowedRuleTypes = useMemo(
    () =>
      baseType === "text"
        ? allowedRuleTypes.filter((ruleType) => ruleType !== "email" && ruleType !== "url")
        : allowedRuleTypes,
    [allowedRuleTypes, baseType]
  );
  const activeRuleId = useMemo(() => {
    if (!visibleRules.length) return null;
    if (selectedRuleId && visibleRules.some((rule) => rule.id === selectedRuleId)) return selectedRuleId;
    return visibleRules[0].id;
  }, [selectedRuleId, visibleRules]);

  const removeRule = (ruleId: string) =>
    onConfigChange({
      ...config,
      rules: config.rules.filter((rule) => rule.id !== ruleId),
    });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs text-slate-600">{title}</h4>
        <div className="flex items-center gap-1">
          {isReadOnlyLegacy && mode === "simple" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              {importState.status === "custom" ? "Custom" : "Legacy"}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode((prev) => (prev === "raw" ? "simple" : "raw"))}
            className="rounded-[0.33em] px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {mode === "raw" ? "Back" : "<>"}
          </button>
        </div>
      </div>

      {mode === "simple" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ValidationAddRuleMenu
              config={config}
              allowedRuleTypes={menuAllowedRuleTypes}
              onConfigChange={onConfigChange}
              readOnly={isReadOnlyLegacy}
            />
          </div>
          <ValidationRuleChips
            config={config}
            selectedRuleId={activeRuleId}
            onSelectRule={setSelectedRuleId}
            onRemoveRule={removeRule}
            readOnly={isReadOnlyLegacy}
            hiddenRuleTypes={hiddenRuleTypes}
          />
          <ValidationRuleEditor
            config={config}
            selectedRuleId={activeRuleId}
            onConfigChange={onConfigChange}
            readOnly={isReadOnlyLegacy}
          />
          <ValidationLegacyNotice visible={isReadOnlyLegacy} onReplace={replaceWithSimpleRules} />
        </div>
      ) : (
        <ValidationRawEditor value={validator || ""} onChange={onRawChange} />
      )}
    </div>
  );
}
