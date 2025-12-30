/**
 * Validator Engine - Convert simple rules to Zod schemas
 * Users build validators with UI, engine generates Zod code
 */

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
  | "trim";

export interface ValidatorRule {
  id: string; // Unique ID for UI management
  type: ValidatorRuleType;
  params?: {
    value?: number | string | string[]; // Can be array for enum options
    message?: string;
    flags?: string; // For regex
    itemType?: "enum" | "string"; // For array type
    minItems?: number;
    maxItems?: number;
  };
}

export interface ValidatorConfig {
  rules: ValidatorRule[];
}

/**
 * Rule definitions - DRY approach, single source of truth
 */
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
};

/**
 * Get all available rules for the UI dropdown
 * Excludes 'trim' since it's applied by default
 */
export function getAvailableRules() {
  return Object.entries(RULE_DEFINITIONS)
    .filter(([type]) => type !== "trim") // Hide trim - it's always applied
    .map(([type, def]) => ({
      type: type as ValidatorRuleType,
      ...def,
    }));
}

/**
 * Get definition for a specific rule type
 */
export function getRuleDefinition(type: ValidatorRuleType) {
  return RULE_DEFINITIONS[type];
}

/**
 * Generate human-readable description of a rule
 */
export function getRuleDescription(rule: ValidatorRule): string {
  const def = getRuleDefinition(rule.type);

  switch (rule.type) {
    case "minLength":
      return `Minimum ${rule.params?.value} characters`;
    case "maxLength":
      return `Maximum ${rule.params?.value} characters`;
    case "min":
      return `Minimum value: ${rule.params?.value}`;
    case "max":
      return `Maximum value: ${rule.params?.value}`;
    case "regex":
      return `Matches pattern: ${rule.params?.value}`;
    case "enum":
      const enumCount = Array.isArray(rule.params?.value) ? rule.params.value.length : 0;
      return `${enumCount} options available`;
    case "array":
      const arrayCount = Array.isArray(rule.params?.value) ? rule.params.value.length : 0;
      const minItems = rule.params?.minItems;
      const maxItems = rule.params?.maxItems;
      let arrayDesc = `${arrayCount} items`;
      if (minItems || maxItems) {
        arrayDesc += ` (${minItems || "0"}-${maxItems || "all"})`;
      }
      return arrayDesc;
    case "trim":
      return "Whitespace will be trimmed";
    default:
      return def.label;
  }
}

/**
 * Convert validator config to Zod schema code string
 * This is the core conversion logic - clean and maintainable
 */
export function validatorConfigToZodCode(config: ValidatorConfig): string {
  if (!config.rules || config.rules.length === 0) {
    return getDefaultStringValidator();
  }

  // Check for standalone rules (enum, array) that don't need wrapping
  const enumRule = config.rules.find((r) => r.type === "enum");
  if (enumRule) {
    return generateEnumValidator(enumRule);
  }

  const arrayRule = config.rules.find((r) => r.type === "array");
  if (arrayRule) {
    return generateArrayValidator(arrayRule);
  }

  // For string validators, wrap in preprocess with trim by default
  return generatePreprocessedStringValidator(config);
}

/**
 * Generate z.enum validator
 */
function generateEnumValidator(rule: ValidatorRule): string {
  const options = Array.isArray(rule.params?.value) ? rule.params.value : [];
  const optionsStr = options.map((o) => `"${o}"`).join(", ");
  const message = rule.params?.message || "This field is required.";
  return `z.enum([${optionsStr}], {message:"${message}"})`;
}

/**
 * Generate z.array validator for multi-select
 */
function generateArrayValidator(rule: ValidatorRule): string {
  const options = Array.isArray(rule.params?.value) ? rule.params.value : [];
  const optionsStr = options.map((o) => `"${o}"`).join(", ");
  let zodCode = `z.array(z.enum([${optionsStr}], {message:"This field is required."}))`;

  const minItems = rule.params?.minItems;
  const maxItems = rule.params?.maxItems;

  if (minItems) {
    const msg = minItems === 1 ? "Select at least 1 item." : `Select at least ${minItems} items.`;
    zodCode += `.min(${minItems}, { message: "${msg}" })`;
  }

  if (maxItems) {
    const msg = `Select at most ${maxItems} item${maxItems > 1 ? "s" : ""}.`;
    zodCode += `.max(${maxItems}, { message: "${msg}" })`;
  }

  return zodCode;
}

/**
 * Generate z.preprocess(...z.string()...) validator
 * Always wraps strings in preprocess with trim by default
 */
function generatePreprocessedStringValidator(config: ValidatorConfig): string {
  let zodCode = "z.string()";

  // Type conversions
  const typeRules = config.rules.filter(
    (r) => r.type === "number" || r.type === "email" || r.type === "url"
  );

  if (typeRules.some((r) => r.type === "number")) {
    zodCode = "z.number()";
  } else if (typeRules.some((r) => r.type === "email")) {
    zodCode = "z.string()";
  } else if (typeRules.some((r) => r.type === "url")) {
    zodCode = "z.string()";
  }

  // For non-number types, wrap in preprocess
  if (!zodCode.includes("z.number()")) {
    // Apply all validations to core string validator
    // Filter out invalid rules (those that need values but don't have them)
    const validationRules = config.rules.filter((r) => {
      if (r.type === "number" || r.type === "enum" || r.type === "array" || r.type === "trim") {
        return false; // Skip these, handled elsewhere
      }
      // Skip rules that need values but don't have them
      const def = getRuleDefinition(r.type);
      if (def.needsValue && (!r.params?.value || r.params.value === "")) {
        return false;
      }
      return true;
    });

    // Add required error if needed
    if (config.rules.some((r) => r.type === "required")) {
      zodCode = `z.string({ required_error: "This field is required." })`;
    } else {
      zodCode = "z.string()";
    }

    // Always add trim
    zodCode += ".trim()";

    // Add validations
    for (const rule of validationRules) {
      zodCode += getRuleZodChain(rule);
    }

    // Wrap in preprocess
    const preprocessCode = `z.preprocess(
  v => ((v ?? null) == null ? "" : v),
  ${zodCode}
)`;
    return preprocessCode;
  }

  // For number types, don't wrap in preprocess
  // Filter out invalid rules
  const validNumberRules = config.rules.filter((r) => {
    if (r.type === "enum" || r.type === "array" || r.type === "trim") {
      return false;
    }
    const def = getRuleDefinition(r.type);
    if (def.needsValue && (!r.params?.value || r.params.value === "")) {
      return false;
    }
    return true;
  });

  for (const rule of validNumberRules) {
    zodCode += getRuleZodChain(rule);
  }

  return zodCode;
}

/**
 * Default string validator with preprocess
 */
function getDefaultStringValidator(): string {
  return `z.preprocess(
  v => ((v ?? null) == null ? "" : v),
  z.string()
)`;
}

/**
 * Get the Zod chain for a specific rule
 * DRY: Single place to define how each rule maps to Zod
 */
function getRuleZodChain(rule: ValidatorRule): string {
  const message = rule.params?.message;
  const messageObj = message ? `, { message: "${message}" }` : "";

  switch (rule.type) {
    case "required":
      return `.nonempty()`;
    case "minLength":
      return `.min(${rule.params?.value}${messageObj})`;
    case "maxLength":
      return `.max(${rule.params?.value}${messageObj})`;
    case "min":
      return `.min(${rule.params?.value}${messageObj})`;
    case "max":
      return `.max(${rule.params?.value}${messageObj})`;
    case "regex":
      const pattern = rule.params?.value || "";
      const flags = rule.params?.flags || "";
      const flagsStr = flags ? `/${flags}` : "";
      return `.regex(/${pattern}/${flagsStr}${messageObj})`;
    case "email":
      return `.email()`;
    case "url":
      return `.url()`;
    case "number":
    case "enum":
    case "array":
    case "trim":
      return ""; // Handled elsewhere
    default:
      return "";
  }
}

/**
 * Generate a new rule with unique ID
 */
export function createValidatorRule(type: ValidatorRuleType): ValidatorRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    params: {}, // Always initialize params, even for rules that don't need values
  };
}

/**
 * Validate that a rule has all required parameters
 */
export function isRuleValid(rule: ValidatorRule): boolean {
  const def = getRuleDefinition(rule.type);
  if (!def.needsValue) return true;
  return rule.params?.value !== undefined && rule.params.value !== "" && rule.params.value !== null;
}

/**
 * Convert Zod code string back to validator config (reverse parsing)
 * Handles: enum, array, preprocess, string validators, and more
 */
export function zodCodeToValidatorConfig(zodCode: string): ValidatorConfig {
  if (!zodCode || typeof zodCode !== "string") {
    return { rules: [] };
  }

  const rules: ValidatorRule[] = [];
  const sanitized = zodCode.trim();

  // ===== Parse ENUM =====
  const enumMatch = sanitized.match(/z\.enum\(\s*\[([^\]]+)\]\s*,\s*\{message\s*:\s*"([^"]+)"\}/);
  if (enumMatch) {
    // Extract enum options
    const optionsStr = enumMatch[1];
    const options = optionsStr
      .split(",")
      .map((opt) => opt.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    const rule = createValidatorRule("enum");
    rule.params = {
      value: options,
      message: enumMatch[2],
    };
    rules.push(rule);
    return { rules }; // Enum is standalone, return immediately
  }

  // ===== Parse ARRAY (multi-select) =====
  const arrayMatch = sanitized.match(/z\.array\(z\.enum\(\s*\[([^\]]+)\]/);
  if (arrayMatch) {
    const optionsStr = arrayMatch[1];
    const options = optionsStr
      .split(",")
      .map((opt) => opt.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    // Extract min items
    const minMatch = sanitized.match(/\.min\((\d+),\s*\{\s*message\s*:\s*"([^"]+)"\}/);
    const minItems = minMatch ? parseInt(minMatch[1]) : undefined;

    // Extract max items
    const maxMatch = sanitized.match(/\.max\((\d+),\s*\{\s*message\s*:\s*"([^"]+)"\}/);
    const maxItems = maxMatch ? parseInt(maxMatch[1]) : undefined;

    const rule = createValidatorRule("array");
    rule.params = {
      value: options,
      itemType: "enum",
      ...(minItems && { minItems }),
      ...(maxItems && { maxItems }),
    };
    rules.push(rule);
    return { rules }; // Array is standalone, return immediately
  }

  // ===== Parse PREPROCESS wrapper =====
  // Extract the inner z.string() validator from preprocess
  let coreValidator = sanitized;
  const preprocessMatch = sanitized.match(/z\.preprocess\(\s*[\s\S]*?,\s*(z\..*)\s*\)$/m);
  if (preprocessMatch) {
    // We found a preprocess wrapper, extract the core validator
    coreValidator = preprocessMatch[1];
    // Don't add trim rule to UI - it's always applied by default
  }

  // ===== Parse STRING validators =====
  let isNumber = coreValidator.includes("z.number()");

  // Type/format modifiers
  if (coreValidator.includes(".email()")) {
    rules.push(createValidatorRule("email"));
  } else if (coreValidator.includes(".url()")) {
    rules.push(createValidatorRule("url"));
  } else if (isNumber) {
    rules.push(createValidatorRule("number"));
  }

  // Required (nonempty or required_error)
  if (
    coreValidator.includes(".nonempty()") ||
    coreValidator.includes('required_error: "This field is required"')
  ) {
    rules.push(createValidatorRule("required"));
  }

  // Don't add trim rule - it's always applied by default
  // if (coreValidator.includes(".trim()") && !rules.some((r) => r.type === "trim")) {
  //   rules.push(createValidatorRule("trim"));
  // }

  // Min length/value with message
  const minMatch = coreValidator.match(/\.min\((\d+),\s*\{\s*message\s*:\s*"([^"]+)"\}/);
  if (minMatch) {
    const rule = createValidatorRule(isNumber ? "min" : "minLength");
    rule.params = {
      value: parseInt(minMatch[1]),
      message: minMatch[2],
    };
    rules.push(rule);
  }

  // Max length/value with message
  const maxMatch = coreValidator.match(/\.max\((\d+),\s*\{\s*message\s*:\s*"([^"]+)"\}/);
  if (maxMatch) {
    const rule = createValidatorRule(isNumber ? "max" : "maxLength");
    rule.params = {
      value: parseInt(maxMatch[1]),
      message: maxMatch[2],
    };
    rules.push(rule);
  }

  // Regex with message
  const regexMatch = coreValidator.match(/\.regex\(\s*\/([^/]+)\/([gimuy]*),\s*"([^"]+)"\s*\)/);
  if (regexMatch) {
    const rule = createValidatorRule("regex");
    rule.params = {
      value: regexMatch[1],
      ...(regexMatch[2] && { flags: regexMatch[2] }),
      message: regexMatch[3],
    };
    rules.push(rule);
  }

  return { rules };
}

/**
 * Test/debug function to verify parsing works
 * Pass in any Zod code and it will show what it parsed
 */
export function testValidatorParsing(zodCode: string) {
  console.log("Input Zod Code:", zodCode);
  const config = zodCodeToValidatorConfig(zodCode);
  console.log("Parsed Config:", JSON.stringify(config, null, 2));
  console.log("Regenerated Zod:", validatorConfigToZodCode(config));
  return config;
}
