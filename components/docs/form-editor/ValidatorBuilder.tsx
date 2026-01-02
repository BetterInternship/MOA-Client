/**
 * Validator Builder UI
 * Comprehensive UI builder for non-technical users to create Zod validators
 * Also includes raw code mode for developers
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Code, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ValidatorRule,
  ValidatorConfig,
  getAvailableRules,
  getRuleDefinition,
  getRuleDescription,
  createValidatorRule,
  isRuleValid,
  validatorConfigToZodCode,
  zodCodeToValidatorConfig,
} from "@/lib/validator-engine";

interface ValidatorBuilderProps {
  config: ValidatorConfig;
  onConfigChange: (config: ValidatorConfig) => void;
  rawZodCode?: string;
  onRawZodChange?: (code: string) => void;
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

  // Sync rawZodCode from parent when it changes externally
  useEffect(() => {
    setLocalRawCode(rawZodCode || "");
  }, [rawZodCode]);

  const availableRules = getAvailableRules();

  const addRule = (ruleType: any) => {
    const newRule = createValidatorRule(ruleType);
    onConfigChange({
      ...config,
      rules: [...config.rules, newRule],
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
    onConfigChange({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    });
  };

  const handleRawZodBlur = () => {
    // Only sync when user is done editing (blur)
    onRawZodChange?.(localRawCode);
    try {
      const parsed = zodCodeToValidatorConfig(localRawCode);
      onConfigChange(parsed);
    } catch (e) {
      // Keep the raw code even if parsing fails
    }
  };

  const zodCode = validatorConfigToZodCode(config);

  // RAW CODE MODE - For developers
  if (mode === "raw") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-gray-700">Raw Zod Code</label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMode("ui")}
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
          placeholder={`z.string().min(8)\nz.enum(["A", "B"])`}
          className="w-full rounded border border-gray-300 bg-white p-2 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          rows={4}
        />
      </div>
    );
  }

  // UI BUILDER MODE - For non-technical users
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
  const [localValue, setLocalValue] = useState(rule.params?.value || "");
  const [localMessage, setLocalMessage] = useState(rule.params?.message || "");
  const [optionsText, setOptionsText] = useState(optionsArray.join("\n"));

  // Sync local state when rule changes
  useEffect(() => {
    setLocalValue(rule.params?.value || "");
    setLocalMessage(rule.params?.message || "");
    const opts = Array.isArray(rule.params?.value) ? rule.params.value : [];
    setOptionsText(opts.join("\n"));
  }, [rule.params?.value, rule.params?.message]);

  // Safety check - if no definition found, show error state (after hooks)
  if (!definition) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-2">
        <div className="text-xs text-red-600">Unknown rule type: {rule.type}</div>
      </div>
    );
  }

  const handleBlur = () => {
    // Only update parent when user is done editing (blur)
    const processedValue =
      definition.valueType === "number" ? parseInt(localValue as string) || 0 : localValue;

    onUpdate({
      params: {
        ...rule.params,
        value: processedValue,
        message: localMessage,
      },
    });
  };

  // Special handling for enum/array options
  if (rule.type === "enum" || rule.type === "array") {
    const handleOptionsBlur = () => {
      const newOptions = optionsText
        .split("\n")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

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
            onChange={(e) => setOptionsText(e.target.value)}
            onBlur={handleOptionsBlur}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            rows={Math.min(Math.max(3, optionsArray.length + 1), 6)}
          />

          <input
            type="text"
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            onBlur={handleOptionsBlur}
            placeholder="Error message (optional)"
            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  // Regular rules (minLength, maxLength, etc.)
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
            placeholder={
              definition.valueType === "number"
                ? "e.g., 8"
                : definition.type === "regex"
                  ? "e.g., ^[A-Z].*"
                  : "Value"
            }
            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        )}

        <input
          type="text"
          value={localMessage}
          onChange={(e) => setLocalMessage(e.target.value)}
          onBlur={handleBlur}
          placeholder="Error message (optional)"
          className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
