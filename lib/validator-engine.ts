/**
 * Validator Engine - Refactored for robustness and maintainability
 *
 * Architecture:
 * - REGEX_PATTERNS: Single source of truth for all parsing patterns
 * - Parser helpers: Extract common patterns (min, max, message)
 * - Generator helpers: Build Zod code from components
 * - Public API: zodCodeToValidatorConfig() and validatorConfigToZodCode()
 */

// ============================================================================
// TYPES
// ============================================================================

export type ValidatorRuleType =
  | "required"
  | "minLength"
  | "maxLength"
  | "email"
  | "number"
  | "min"
  | "max"
  | "regex"
  | "url"
  | "enum"
  | "array"
  | "trim"
  | "date"
  | "minDate"
  | "maxDate"
  | "plainText";

export interface ValidatorRule {
  id: string;
  type: ValidatorRuleType;
  params?: {
    value?: number | string | string[];
    message?: string;
    flags?: string;
    itemType?: "enum" | "string";
    minItems?: number;
    maxItems?: number;
    minMessage?: string;
    maxMessage?: string;
  };
}

export interface ValidatorConfig {
  rules: ValidatorRule[];
}

// ============================================================================
// REGEX PATTERNS - Single source of truth
// ============================================================================

const REGEX_PATTERNS = {
  // Normalize whitespace
  newlines: /\n\s*/g,
  multiSpace: /\s+/g,
  trailingSemicolon: /;$/,

  // Type detection
  numberType: /z\.number\(\)/,
  dateType: /z\.coerce\.date\(\)/,
  emailFormat: /\.email\(\)/,
  urlFormat: /\.url\(\)/,

  // Parse constraints
  minConstraint: /\.min\(\s*(\d+)[^)]*message\s*:\s*"([^"]+)"/,
  maxConstraint: /\.max\(\s*(\d+)[^)]*message\s*:\s*"([^"]+)"/,
  minDateConstraint: /\.min\(\s*new\s+Date\(\s*"([^"]+)"\s*\)[^)]*message\s*:\s*"([^"]+)"/,
  maxDateConstraint: /\.max\(\s*new\s+Date\(\s*"([^"]+)"\s*\)[^)]*message\s*:\s*"([^"]+)"/,

  // Parse enums
  enum: /z\.enum\(\s*\[([^\]]+)\]\s*,\s*\{[^}]*message\s*:\s*"([^"]+)"[^}]*\}/,
  arrayStart: /z\.array\(\s*z\.enum\(\s*\[([^\]]+)\]/,

  // Parse other formats
  required: /\.nonempty\(\)|required_error|"This field is required"/,
  preprocess: /z\.preprocess\([^,]+,\s*(z\..*)\s*\)$/,
  regex: /\.regex\(\s*\/([^/]+)\/([gimuy]*)[^)]*message\s*:\s*"([^"]+)"/,
  regexConstructor:
    /\.regex\(\s*new\s+RegExp\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)[^)]*message\s*:\s*"([^"]+)"/,
} as const;

// ============================================================================
// RULE DEFINITIONS - Single source of truth
// ============================================================================

const RULE_DEFINITIONS: Record<
  ValidatorRuleType,
  {
    label: string;
    description: string;
    needsValue: boolean;
    valueType: "number" | "string" | "none" | "list";
  }
> = {
  required: {
    label: "Required",
    description: "Field must have a value",
    needsValue: false,
    valueType: "none",
  },
  minLength: {
    label: "Minimum Length",
    description: "Text must be at least X characters",
    needsValue: true,
    valueType: "number",
  },
  maxLength: {
    label: "Maximum Length",
    description: "Text can be at most X characters",
    needsValue: true,
    valueType: "number",
  },
  email: {
    label: "Email Format",
    description: "Must be a valid email address",
    needsValue: false,
    valueType: "none",
  },
  url: {
    label: "URL Format",
    description: "Must be a valid URL",
    needsValue: false,
    valueType: "none",
  },
  number: {
    label: "Number",
    description: "Must be a number",
    needsValue: false,
    valueType: "none",
  },
  min: {
    label: "Minimum Value",
    description: "Number must be at least X",
    needsValue: true,
    valueType: "number",
  },
  max: {
    label: "Maximum Value",
    description: "Number can be at most X",
    needsValue: true,
    valueType: "number",
  },
  regex: {
    label: "Pattern Match",
    description: "Must match regex pattern",
    needsValue: true,
    valueType: "string",
  },
  trim: {
    label: "Trim Whitespace",
    description: "Remove leading/trailing spaces",
    needsValue: false,
    valueType: "none",
  },
  enum: {
    label: "Dropdown Options",
    description: "Choose from predefined options",
    needsValue: true,
    valueType: "list",
  },
  array: {
    label: "Multi-Select",
    description: "Select multiple items from a list",
    needsValue: true,
    valueType: "list",
  },
  date: {
    label: "Date Format",
    description: "Must be a valid date",
    needsValue: false,
    valueType: "none",
  },
  minDate: {
    label: "Minimum Date",
    description: "Date must be on or after X",
    needsValue: true,
    valueType: "string",
  },
  maxDate: {
    label: "Maximum Date",
    description: "Date must be on or before X",
    needsValue: true,
    valueType: "string",
  },
  plainText: {
    label: "Plain Text Only",
    description: "Title case and characters only (A–Z, 0–9, spaces, basic punctuation)",
    needsValue: false,
    valueType: "none",
  },
};

// ============================================================================
// PARSER HELPERS - Extract from Zod code
// ============================================================================

function normalizeZodCode(zodCode: string): string {
  return zodCode
    .replace(REGEX_PATTERNS.newlines, " ")
    .replace(REGEX_PATTERNS.multiSpace, " ")
    .replace(REGEX_PATTERNS.trailingSemicolon, "")
    .trim();
}

function parseMinConstraint(code: string): { value: number; message: string } | null {
  const match = code.match(REGEX_PATTERNS.minConstraint);
  return match ? { value: parseInt(match[1]), message: match[2] } : null;
}

function parseMaxConstraint(code: string): { value: number; message: string } | null {
  const match = code.match(REGEX_PATTERNS.maxConstraint);
  return match ? { value: parseInt(match[1]), message: match[2] } : null;
}

function parseEnumOptions(optionsStr: string): string[] {
  const options: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < optionsStr.length; i++) {
    const char = optionsStr[i];

    // Toggle quote state
    if ((char === '"' || char === "'") && (i === 0 || optionsStr[i - 1] !== "\\")) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar) {
        inQuotes = false;
        current += char;
      } else {
        current += char;
      }
    } else if (char === "," && !inQuotes) {
      // Found a separator outside quotes
      const trimmed = current.trim().replace(/^["']|["']$/g, "");
      if (trimmed) {
        options.push(trimmed);
      }
      current = "";
    } else {
      current += char;
    }
  }

  // Don't forget the last option
  const trimmed = current.trim().replace(/^["']|["']$/g, "");
  if (trimmed) {
    options.push(trimmed);
  }

  return options;
}

function getCoreValidator(code: string): string {
  const match = code.match(REGEX_PATTERNS.preprocess);
  return match ? match[1] : code;
}

// ============================================================================
// GENERATOR HELPERS - Build Zod code
// ============================================================================

function buildEnumValidator(options: string[], message: string): string {
  const optionsStr = options.map((o) => `"${o}"`).join(", ");
  return `z.enum([${optionsStr}], {message:"${message}"})`;
}

function buildArrayValidator(
  options: string[],
  minItems?: number,
  minMessage?: string,
  maxItems?: number,
  maxMessage?: string
): string {
  // Format options with proper indentation on separate lines
  const optionsStr = options.map((o) => `"${o}"`).join(",\n      ");
  let code = `z.array(\n  z.enum(\n    [\n      ${optionsStr}\n    ],\n    { message: "This field is required." }\n  )\n)`;

  if (minItems) {
    const msg = minMessage || `Select at least ${minItems} item${minItems > 1 ? "s" : ""}.`;
    code += `.min(${minItems}, { message: "${msg}" })`;
  }

  if (maxItems) {
    const msg = maxMessage || `Select at most ${maxItems} item${maxItems > 1 ? "s" : ""}.`;
    code += `.max(${maxItems}, { message: "${msg}" })`;
  }

  code += '.describe("multiselect")';

  return code;
}

function buildStringValidatorChain(rules: ValidatorRule[]): string {
  let code = "z.string()";

  if (rules.some((r) => r.type === "email")) {
    code += ".email()";
  }
  if (rules.some((r) => r.type === "url")) {
    code += ".url()";
  }

  if (rules.some((r) => r.type === "required")) {
    code += '.nonempty({ message: "This field is required." })';
  }

  const minRule = rules.find((r) => r.type === "minLength");
  if (minRule) {
    const value = String(minRule.params?.value ?? 0);
    const msg = minRule.params?.message || `Minimum ${value} characters.`;
    code += `.min(${value}, { message: "${msg}" })`;
  }

  const maxRule = rules.find((r) => r.type === "maxLength");
  if (maxRule) {
    const value = String(maxRule.params?.value ?? 0);
    const msg = maxRule.params?.message || `Maximum ${value} characters.`;
    code += `.max(${value}, { message: "${msg}" })`;
  }

  const regexRule = rules.find((r) => r.type === "regex");
  if (regexRule) {
    const pattern = String(regexRule.params?.value ?? "");
    const flags = String(regexRule.params?.flags ?? "");
    const msg = String(regexRule.params?.message ?? "Invalid format.");
    // Use RegExp constructor for complex patterns (e.g., with Unicode properties)
    if (flags.includes("u") || pattern.includes("\\p{")) {
      code += `.regex(new RegExp("${pattern}", "${flags}"), { message: "${msg}" })`;
    } else {
      code += `.regex(/${pattern}/${flags}, { message: "${msg}" })`;
    }
  }

  // Plain text preset (title case and characters only)
  if (rules.some((r) => r.type === "plainText")) {
    return `z.string({ required_error: "This field is required." }).trim().min(1, { message: "This field is required." }).max(100).regex(/^(?!.*[\\p{Extended_Pictographic}\\uFE0F])(?!.*[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F])(?!.*[\\u202A-\\u202E\\u2066-\\u2069])[\\p{L}\\p{M}\\p{Pc}\\p{Pd}\\p{Ps}\\p{Pe}\\p{Pi}\\p{Pf}\\p{Po}\\p{Zs}\\n\\r\\t]+$/u, "This field accepts letters, spaces, and common punctuation only. No numbers or emojis.").refine(s => s.replace(/\\p{L}+/gu, w => w[0].toLocaleUpperCase() + w.slice(1).toLocaleLowerCase()) === s, "Please write in title case (capitalize the first letter of each word).")`;
  }

  return code;
}

function buildNumberValidatorChain(rules: ValidatorRule[]): string {
  let code = "z.number()";

  if (rules.some((r) => r.type === "required")) {
    code += '.refine((val) => val !== null, { message: "This field is required." })';
  }

  const minRule = rules.find((r) => r.type === "min");
  if (minRule) {
    const value = String(minRule.params?.value ?? 0);
    const msg = minRule.params?.message || `Minimum value: ${value}.`;
    code += `.min(${value}, { message: "${msg}" })`;
  }

  const maxRule = rules.find((r) => r.type === "max");
  if (maxRule) {
    const value = String(maxRule.params?.value ?? 0);
    const msg = maxRule.params?.message || `Maximum value: ${value}.`;
    code += `.max(${value}, { message: "${msg}" })`;
  }

  return code;
}

function buildDateValidatorChain(rules: ValidatorRule[]): string {
  let code = "z.coerce.date()";

  if (rules.some((r) => r.type === "required")) {
    code +=
      '.refine((val) => val !== null && val !== undefined, { message: "This field is required." })';
  }

  const minDateRule = rules.find((r) => r.type === "minDate");
  if (minDateRule && minDateRule.params?.value) {
    const dateValue = String(minDateRule.params.value);
    const msg = minDateRule.params?.message || `Date must be on or after ${dateValue}.`;
    code += `.min(new Date("${dateValue}"), { message: "${msg}" })`;
  }

  const maxDateRule = rules.find((r) => r.type === "maxDate");
  if (maxDateRule && maxDateRule.params?.value) {
    const dateValue = String(maxDateRule.params.value);
    const msg = maxDateRule.params?.message || `Date must be on or before ${dateValue}.`;
    code += `.max(new Date("${dateValue}"), { message: "${msg}" })`;
  }

  return code;
}

function wrapInPreprocess(validator: string): string {
  return `z.preprocess((v) => ((v ?? null) == null ? "" : (typeof v === "string" ? v.trim() : v)), ${validator})`;
}

// ============================================================================
// PUBLIC API - zodCodeToValidatorConfig
// ============================================================================

export function zodCodeToValidatorConfig(zodCode: string): ValidatorConfig {
  if (!zodCode || typeof zodCode !== "string") {
    return { rules: [] };
  }

  const rules: ValidatorRule[] = [];
  const sanitized = normalizeZodCode(zodCode);

  // Try array FIRST (before enum) since array contains enum inside it
  {
    const match = sanitized.match(REGEX_PATTERNS.arrayStart);
    if (match) {
      const options = parseEnumOptions(match[1]);
      const minConstraint = parseMinConstraint(sanitized);
      const maxConstraint = parseMaxConstraint(sanitized);

      const rule = createValidatorRule("array");
      rule.params = {
        value: options,
        itemType: "enum",
        ...(minConstraint && { minItems: minConstraint.value, minMessage: minConstraint.message }),
        ...(maxConstraint && { maxItems: maxConstraint.value, maxMessage: maxConstraint.message }),
      };
      rules.push(rule);
      return { rules };
    }
  }

  // Try enum (standalone) - AFTER array
  {
    const match = sanitized.match(REGEX_PATTERNS.enum);
    if (match) {
      const options = parseEnumOptions(match[1]);
      const rule = createValidatorRule("enum");
      rule.params = { value: options, message: match[2] };
      rules.push(rule);
      return { rules };
    }
  }

  // Detect plainText preset by checking for the specific regex and refine pattern
  {
    const plainTextRegex = /Extended_Pictographic.*u.*refine.*toLocaleUpperCase.*toLocaleLowerCase/;
    if (plainTextRegex.test(sanitized)) {
      rules.push(createValidatorRule("plainText"));
      return { rules };
    }
  }

  // Parse string/number validators
  const coreValidator = getCoreValidator(sanitized);
  const isNumber = REGEX_PATTERNS.numberType.test(coreValidator);
  const isDate = REGEX_PATTERNS.dateType.test(coreValidator);

  // Type modifiers
  if (REGEX_PATTERNS.emailFormat.test(coreValidator)) {
    rules.push(createValidatorRule("email"));
  }
  if (REGEX_PATTERNS.urlFormat.test(coreValidator)) {
    rules.push(createValidatorRule("url"));
  }
  if (isNumber) {
    rules.push(createValidatorRule("number"));
  }
  if (isDate) {
    rules.push(createValidatorRule("date"));
  }

  // Required check
  if (REGEX_PATTERNS.required.test(coreValidator)) {
    rules.push(createValidatorRule("required"));
  }

  // Constraints (min/max or minDate/maxDate)
  if (!rules.some((r) => r.type === "array")) {
    if (isDate) {
      // Parse date constraints
      const minDateMatch = coreValidator.match(REGEX_PATTERNS.minDateConstraint);
      if (minDateMatch) {
        const rule = createValidatorRule("minDate");
        rule.params = { value: minDateMatch[1], message: minDateMatch[2] };
        rules.push(rule);
      }

      const maxDateMatch = coreValidator.match(REGEX_PATTERNS.maxDateConstraint);
      if (maxDateMatch) {
        const rule = createValidatorRule("maxDate");
        rule.params = { value: maxDateMatch[1], message: maxDateMatch[2] };
        rules.push(rule);
      }
    } else {
      // Parse numeric/length constraints
      const minConstraint = parseMinConstraint(coreValidator);
      if (minConstraint) {
        const rule = createValidatorRule(isNumber ? "min" : "minLength");
        rule.params = { value: minConstraint.value, message: minConstraint.message };
        rules.push(rule);
      }

      const maxConstraint = parseMaxConstraint(coreValidator);
      if (maxConstraint) {
        const rule = createValidatorRule(isNumber ? "max" : "maxLength");
        rule.params = { value: maxConstraint.value, message: maxConstraint.message };
        rules.push(rule);
      }
    }
  }

  // Regex pattern - support both literal /pattern/flags and new RegExp() formats
  {
    // Try RegExp constructor first (for Unicode properties)
    const constructorMatch = coreValidator.match(REGEX_PATTERNS.regexConstructor);
    if (constructorMatch) {
      const rule = createValidatorRule("regex");
      rule.params = {
        value: constructorMatch[1],
        flags: constructorMatch[2],
        message: constructorMatch[3],
      };
      rules.push(rule);
    } else {
      // Fall back to regex literal format
      const literalMatch = coreValidator.match(REGEX_PATTERNS.regex);
      if (literalMatch) {
        const rule = createValidatorRule("regex");
        rule.params = {
          value: literalMatch[1],
          ...(literalMatch[2] && { flags: literalMatch[2] }),
          message: literalMatch[3],
        };
        rules.push(rule);
      }
    }
  }

  return { rules };
}

// ============================================================================
// PUBLIC API - validatorConfigToZodCode
// ============================================================================

export function validatorConfigToZodCode(config: ValidatorConfig): string {
  if (!config.rules || config.rules.length === 0) {
    return `z.preprocess((v) => ((v ?? null) == null ? "" : (typeof v === "string" ? v.trim() : v)), z.string())`;
  }

  // Check for standalone rules
  const enumRule = config.rules.find((r) => r.type === "enum");
  if (enumRule && Array.isArray(enumRule.params?.value)) {
    return buildEnumValidator(
      enumRule.params.value,
      enumRule.params?.message || "This field is required."
    );
  }

  const arrayRule = config.rules.find((r) => r.type === "array");
  if (arrayRule && Array.isArray(arrayRule.params?.value)) {
    return buildArrayValidator(
      arrayRule.params.value,
      arrayRule.params?.minItems,
      arrayRule.params?.minMessage,
      arrayRule.params?.maxItems,
      arrayRule.params?.maxMessage
    );
  }

  // Check for date type
  const isDateType = config.rules.some(
    (r) => r.type === "date" || r.type === "minDate" || r.type === "maxDate"
  );

  if (isDateType) {
    return buildDateValidatorChain(config.rules);
  }

  // Check for number type FIRST (before string)
  // If user has min/max rules, it's definitely a number field
  const isNumberType = config.rules.some(
    (r) => r.type === "number" || r.type === "min" || r.type === "max"
  );

  if (isNumberType) {
    return buildNumberValidatorChain(config.rules);
  }

  // Default: string with preprocess + trim
  const validator = buildStringValidatorChain(config.rules);
  return wrapInPreprocess(validator);
}

// ============================================================================
// PUBLIC API - Helper functions
// ============================================================================

export function getAvailableRules() {
  return Object.entries(RULE_DEFINITIONS)
    .filter(([type]) => type !== "trim")
    .map(([type, def]) => ({
      type: type as ValidatorRuleType,
      ...def,
    }));
}

export function getRuleDefinition(type: ValidatorRuleType) {
  return RULE_DEFINITIONS[type];
}

export function getRuleDescription(rule: ValidatorRule): string {
  const def = getRuleDefinition(rule.type);

  switch (rule.type) {
    case "minLength":
      return `Minimum ${String(rule.params?.value)} characters`;
    case "maxLength":
      return `Maximum ${String(rule.params?.value)} characters`;
    case "min":
      return `Minimum value: ${String(rule.params?.value)}`;
    case "max":
      return `Maximum value: ${String(rule.params?.value)}`;
    case "minDate":
      return `On or after ${String(rule.params?.value)}`;
    case "maxDate":
      return `On or before ${String(rule.params?.value)}`;
    case "regex":
      return `Matches pattern: ${String(rule.params?.value)}`;
    case "email":
    case "url":
    case "required":
    case "number":
    case "date":
      return def.label;
    case "enum": {
      const enumCount = Array.isArray(rule.params?.value) ? rule.params.value.length : 0;
      return `${enumCount} options available`;
    }
    case "array": {
      const arrayCount = Array.isArray(rule.params?.value) ? rule.params.value.length : 0;
      const minItems = rule.params?.minItems;
      const maxItems = rule.params?.maxItems;
      let arrayDesc = `${arrayCount} items`;
      if (minItems || maxItems) {
        arrayDesc += ` (${minItems || "0"}-${maxItems || "all"})`;
      }
      return arrayDesc;
    }
    case "trim":
      return "Whitespace will be trimmed";
    default:
      return def.label;
  }
}

export function createValidatorRule(type: ValidatorRuleType): ValidatorRule {
  // Initialize array/enum rules with placeholder options
  if (type === "array") {
    return {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      params: {
        value: ["Option 1", "Option 2"],
        message: "This field is required.",
        minItems: 1,
        minMessage: "Select at least 1 item.",
        maxItems: 2,
        maxMessage: "Select at most 2 items.",
      },
    };
  }

  if (type === "enum") {
    return {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      params: {
        value: ["Option 1", "Option 2"],
        message: "Please select an option",
      },
    };
  }

  // Initialize date rules with today's date as default
  if (type === "minDate" || type === "maxDate") {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    return {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      params: {
        value: today,
        message:
          type === "minDate"
            ? `Date must be on or after ${today}.`
            : `Date must be on or before ${today}.`,
      },
    };
  }

  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    params: {},
  };
}

export function isRuleValid(rule: ValidatorRule): boolean {
  const def = getRuleDefinition(rule.type);
  if (!def.needsValue) return true;
  return rule.params?.value !== undefined && rule.params.value !== "" && rule.params.value !== null;
}

export function testValidatorParsing(zodCode: string) {
  const config = zodCodeToValidatorConfig(zodCode);
  return config;
}
