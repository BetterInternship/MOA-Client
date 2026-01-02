/**
 * Validator Builder UI - Refactored for maintainability
 *
 * Features:
 * - UI mode: Intuitive rule builder for non-technical users
 * - Raw mode: Code editor for developers
 * - Auto-normalization: Handles newlines and spacing automatically
 * - Two-way sync: Changes propagate between UI and raw code
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ValidatorRule,
  ValidatorConfig,
  getAvailableRules,
  getRuleDefinition,
  createValidatorRule,
  validatorConfigToZodCode,
  zodCodeToValidatorConfig,
} from "@/lib/validator-engine";

interface ValidatorBuilderProps {
  config: ValidatorConfig;
  onConfigChange: (config: ValidatorConfig) => void;
  rawZodCode?: string;
  onRawZodChange?: (code: string) => void;
}

/**
 * Normalize Zod code: remove newlines, collapse spaces
 */
function normalizeZodCode(code: string): string {
  return code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ValidatorBuilder({
  config,
  onConfigChange,
  rawZodCode,
  onRawZodChange,
}: ValidatorBuilderProps) {
  const [mode, setMode] = useState<"ui" | "raw">("ui");
  const [showRuleMenu, setShowRuleMenu] = useState(false);
  const [localRawCode, setLocalRawCode] = useState(rawZodCode || "");
  const rawCodeRef = useRef<HTMLTextAreaElement>(null);

  // Sync external rawZodCode changes
  useEffect(() => {
    setLocalRawCode(rawZodCode || "");
  }, [rawZodCode]);

  // ============================================================================
  // UI STATE MANAGEMENT - DRY helpers
  // ============================================================================

  const addRule = (ruleType: ValidatorRule["type"]) => {
    const newRule = createValidatorRule(ruleType);

    // Remove conflicting rules
    // enum and array are mutually exclusive
    let newRules = [...config.rules];
    if (ruleType === "array") {
      newRules = newRules.filter((r) => r.type !== "enum");
    } else if (ruleType === "enum") {
      newRules = newRules.filter((r) => r.type !== "array");
    }

    onConfigChange({
      ...config,
      rules: [...newRules, newRule],
    });
    setShowRuleMenu(false);
  };

  const removeRule = (ruleId: string) => {
    onConfigChange({
      ...config,
      rules: config.rules.filter((r) => r.id !== ruleId),
    });
  };

  const updateRule = (ruleId: string, updates: Partial<ValidatorRule>) => {
    console.log("[updateRule] Updating rule:", ruleId, "with:", updates);
    onConfigChange({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    });
  };

  // ============================================================================
  // RAW MODE HANDLERS
  // ============================================================================

  const handleRawZodBlur = () => {
    const normalized = normalizeZodCode(localRawCode);

    // Save normalized code
    onRawZodChange?.(normalized);

    // Parse and update config for UI display
    try {
      const parsed = zodCodeToValidatorConfig(normalized);
      onConfigChange?.(parsed);
    } catch {
      // Parsing failed - that's ok, raw code is still saved
    }
  };

  const handleRawModeToggle = () => {
    if (mode === "ui") {
      // Switching to raw: normalize the current config's generated code
      const generated = validatorConfigToZodCode(config);
      setLocalRawCode(generated);
      setMode("raw");
    } else {
      // Switching to UI: keep existing code
      setMode("ui");
    }
  };

  // ============================================================================
  // RENDER: RAW CODE MODE
  // ============================================================================

  if (mode === "raw") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-gray-700">Raw Zod Code</label>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRawModeToggle}
            className="h-6 px-2 text-xs"
          >
            Builder
          </Button>
        </div>

        <textarea
          ref={rawCodeRef}
          value={localRawCode}
          onChange={(e) => setLocalRawCode(e.target.value)}
          onBlur={handleRawZodBlur}
          placeholder={`z.string().min(8)\nz.array(z.enum(["A", "B"])).min(1)`}
          className="w-full rounded border border-gray-300 bg-white p-2 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows={4}
        />
        <p className="text-xs text-gray-500">
          Paste multi-line code - it will be automatically normalized
        </p>
      </div>
    );
  }

  // ============================================================================
  // RENDER: UI BUILDER MODE
  // ============================================================================

  const availableRules = getAvailableRules();
  const zodCode = validatorConfigToZodCode(config);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-gray-700">Validation Rules</label>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setMode("raw")}
          className="h-6 px-2 text-xs"
          title="Switch to raw code"
        >
          <Code className="h-3 w-3" />
        </Button>
      </div>

      {/* Add Rule Button */}
      <div className="relative">
        <Button
          size="sm"
          onClick={() => setShowRuleMenu(!showRuleMenu)}
          variant="outline"
          className="h-7 w-full text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Rule
        </Button>

        {/* Rule Menu Dropdown */}
        {showRuleMenu && (
          <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
            {availableRules.map((ruleDef) => (
              <button
                key={ruleDef.type}
                onClick={() => addRule(ruleDef.type)}
                className="w-full border-b border-gray-100 px-2 py-1.5 text-left last:border-0 hover:bg-blue-50"
              >
                <div className="text-xs font-medium text-gray-900">{ruleDef.label}</div>
                <div className="text-xs text-gray-600">{ruleDef.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Rules */}
      {config.rules.length === 0 ? (
        <p className="text-xs text-gray-500">No rules added yet</p>
      ) : (
        <div className="space-y-2">
          {config.rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onUpdate={(updates) => updateRule(rule.id, updates)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
        </div>
      )}

      {/* Generated Code Preview */}
      {config.rules.length > 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 p-2">
          <p className="mb-1 text-xs text-gray-600">Generated:</p>
          <code className="block overflow-x-auto rounded bg-white p-1.5 font-mono text-xs break-words whitespace-pre-wrap text-gray-700">
            {zodCode}
          </code>
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced rule card - user-friendly for non-technical users
 */
function RuleCard({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: ValidatorRule;
  onUpdate: (updates: Partial<ValidatorRule>) => void;
  onRemove: () => void;
}) {
  const definition = getRuleDefinition(rule.type);

  // All useState hooks must be at the top level, before any conditionals
  const optionsArray = Array.isArray(rule.params?.value) ? rule.params.value : [];
  const [localValue, setLocalValue] = useState(
    rule.type === "enum" || rule.type === "array" ? "" : rule.params?.value || ""
  );
  const [localMessage, setLocalMessage] = useState(rule.params?.message || "");
  const [optionsText, setOptionsText] = useState(optionsArray.join("\n"));

  // Sync local state when rule changes
  useEffect(() => {
    if (rule.type === "enum" || rule.type === "array") {
      // For enum/array, sync the options array to optionsText
      const opts = Array.isArray(rule.params?.value) ? rule.params.value : [];
      setOptionsText(opts.join("\n"));
    } else {
      // For regular rules, sync the value
      setLocalValue(rule.params?.value || "");
    }
    setLocalMessage(rule.params?.message || "");
  }, [rule.params?.value, rule.params?.message, rule.type]);

  // Safety check - if no definition found, show error state (after hooks)
  if (!definition) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-2">
        <div className="text-xs text-red-600">Unknown rule type: {rule.type}</div>
      </div>
    );
  }

  const handleBlur = () => {
    // For rules that need values, parse and save
    if (definition.needsValue) {
      const processedValue =
        definition.valueType === "number" ? parseInt(localValue as string) || 0 : localValue;

      onUpdate({
        params: {
          ...rule.params,
          value: processedValue,
          message: localMessage,
        },
      });
    } else {
      // For rules without values, just update message if provided
      onUpdate({
        params: {
          ...rule.params,
          message: localMessage,
        },
      });
    }
  };

  // Special handling for enum/array options
  if (rule.type === "enum" || rule.type === "array") {
    console.log(
      "[RuleCard] Rendering array/enum rule:",
      rule.type,
      "options:",
      optionsArray,
      "text:",
      optionsText
    );
    const handleOptionsChange = (newText: string) => {
      console.log("[handleOptionsChange] Text changed:", newText);
      setOptionsText(newText);

      // Auto-save on every keystroke for enum/array
      const newOptions = newText
        .split("\n")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      console.log("[handleOptionsChange] Final options:", newOptions);
      onUpdate({
        params: {
          ...rule.params,
          value: newOptions,
          message: localMessage,
        },
      });
    };

    return (
      <div className="rounded border border-gray-200 bg-white p-2">
        <div className="mb-1.5 flex items-start justify-between">
          <div className="text-xs font-medium text-gray-800">{definition.label}</div>
          <button
            onClick={onRemove}
            className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          <textarea
            value={optionsText}
            onChange={(e) => handleOptionsChange(e.target.value)}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            rows={Math.min(Math.max(3, optionsArray.length + 1), 6)}
          />

          <input
            type="text"
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            onBlur={() => {
              onUpdate({
                params: {
                  ...rule.params,
                  value: optionsArray,
                  message: localMessage,
                },
              });
            }}
            placeholder="Error message (optional)"
            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />

          {rule.type === "array" && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-xs text-gray-600">Min items</label>
                  <input
                    type="number"
                    value={rule.params?.minItems || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      onUpdate({
                        params: {
                          ...rule.params,
                          minItems: val,
                        },
                      });
                    }}
                    placeholder="e.g., 1"
                    className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max items</label>
                  <input
                    type="number"
                    value={rule.params?.maxItems || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      onUpdate({
                        params: {
                          ...rule.params,
                          maxItems: val,
                        },
                      });
                    }}
                    placeholder="e.g., 2"
                    className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Regular rules (minLength, maxLength, email, required, etc.)
  return (
    <div className="rounded border border-gray-200 bg-white p-2">
      <div className="mb-1.5 flex items-start justify-between">
        <div className="text-xs font-medium text-gray-800">{definition.label}</div>
        <button
          onClick={onRemove}
          className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-1.5">
        {definition.needsValue && (
          <input
            type={definition.valueType === "number" ? "number" : "text"}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={definition.valueType === "number" ? "e.g., 8" : "Value"}
            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        )}

        {definition.needsValue && (
          <input
            type="text"
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            onBlur={handleBlur}
            placeholder="Error message (optional)"
            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        )}

        {!definition.needsValue && (
          <p className="text-xs text-gray-600">{definition.description}</p>
        )}
      </div>
    </div>
  );
}
