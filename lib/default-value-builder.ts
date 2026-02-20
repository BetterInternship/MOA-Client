const TOKEN_REGEX = /#\{([^}]+)\}/g;

export type GuidedDefaultMode = "fixed" | "copy_field" | "template" | "advanced";

export type CompactDefaultKind = "empty" | "field" | "manual" | "custom";

export interface GuidedDefaultValueState {
  mode: GuidedDefaultMode;
  fixedValue: string;
  fieldRef: string;
  template: string;
  canUseGuided: boolean;
}

export interface CompactDefaultValueState {
  kind: CompactDefaultKind;
  fieldRef: string;
  manualValue: string;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  }
  return trimmed;
}

function parseArrowBody(prefiller: string): string | null {
  const trimmed = prefiller.trim();
  const match = trimmed.match(/^\(\s*\)\s*=>\s*([\s\S]+)$/);
  return match ? match[1].trim() : null;
}

export function parsePrefillerToGuidedState(prefiller?: string | null): GuidedDefaultValueState {
  const raw = (prefiller || "").trim();
  if (!raw) {
    return {
      mode: "fixed",
      fixedValue: "",
      fieldRef: "",
      template: "",
      canUseGuided: true,
    };
  }

  const arrowBody = parseArrowBody(raw);
  if (!arrowBody) {
    return {
      mode: "advanced",
      fixedValue: "",
      fieldRef: "",
      template: "",
      canUseGuided: false,
    };
  }

  const copyFieldMatch = arrowBody.match(
    /^\{\s*return\s+#\{([a-zA-Z0-9_.:-]+(?:\([a-zA-Z0-9_.]+\))?)\}\s*;?\s*\}$/
  );
  if (copyFieldMatch) {
    return {
      mode: "copy_field",
      fixedValue: "",
      fieldRef: copyFieldMatch[1],
      template: "",
      canUseGuided: true,
    };
  }

  const quotedLiteralMatch = arrowBody.match(/^(['"])([\s\S]*)\1$/);
  if (quotedLiteralMatch) {
    const parsed = unquote(arrowBody);
    const hasToken = TOKEN_REGEX.test(parsed);
    TOKEN_REGEX.lastIndex = 0;
    if (hasToken) {
      return {
        mode: "template",
        fixedValue: "",
        fieldRef: "",
        template: parsed,
        canUseGuided: true,
      };
    }
    return {
      mode: "fixed",
      fixedValue: parsed,
      fieldRef: "",
      template: "",
      canUseGuided: true,
    };
  }

  const directTokenMatch = arrowBody.match(/^#\{([a-zA-Z0-9_.:-]+(?:\([a-zA-Z0-9_.]+\))?)\}$/);
  if (directTokenMatch) {
    return {
      mode: "copy_field",
      fixedValue: "",
      fieldRef: directTokenMatch[1],
      template: "",
      canUseGuided: true,
    };
  }

  return {
    mode: "advanced",
    fixedValue: "",
    fieldRef: "",
    template: "",
    canUseGuided: false,
  };
}

export function parsePrefillerToCompactState(prefiller?: string | null): CompactDefaultValueState {
  const raw = (prefiller || "").trim();
  if (!raw) {
    return { kind: "empty", fieldRef: "", manualValue: "" };
  }

  const arrowBody = parseArrowBody(raw);
  if (!arrowBody) {
    return { kind: "custom", fieldRef: "", manualValue: "" };
  }

  const copyFieldMatch = arrowBody.match(
    /^\{\s*return\s+#\{([a-zA-Z0-9_.:-]+(?:\([a-zA-Z0-9_.]+\))?)\}\s*;?\s*\}$/
  );
  if (copyFieldMatch) {
    return { kind: "field", fieldRef: copyFieldMatch[1], manualValue: "" };
  }

  const directTokenMatch = arrowBody.match(/^#\{([a-zA-Z0-9_.:-]+(?:\([a-zA-Z0-9_.]+\))?)\}$/);
  if (directTokenMatch) {
    return { kind: "field", fieldRef: directTokenMatch[1], manualValue: "" };
  }

  const quotedLiteralMatch = arrowBody.match(/^(['"])([\s\S]*)\1$/);
  if (quotedLiteralMatch) {
    const parsed = unquote(arrowBody);
    const hasToken = TOKEN_REGEX.test(parsed);
    TOKEN_REGEX.lastIndex = 0;
    if (hasToken) return { kind: "custom", fieldRef: "", manualValue: "" };
    return { kind: "manual", fieldRef: "", manualValue: parsed };
  }

  return { kind: "custom", fieldRef: "", manualValue: "" };
}

export function buildManualPrefiller(value: string): string {
  return `() => ${JSON.stringify(value || "")}`;
}

export function buildFieldRefPrefiller(fieldRef: string): string {
  const safe = fieldRef.trim();
  if (!safe) return "";
  return `() => { return #{${safe}}; }`;
}

export function buildPrefillerFromGuidedState(
  mode: Exclude<GuidedDefaultMode, "advanced">,
  values: { fixedValue: string; fieldRef: string; template: string }
): string {
  if (mode === "copy_field") {
    const fieldRef = values.fieldRef.trim();
    if (!fieldRef) return "";
    return `() => { return #{${fieldRef}}; }`;
  }

  if (mode === "template") {
    return `() => ${JSON.stringify(values.template || "")}`;
  }

  return `() => ${JSON.stringify(values.fixedValue || "")}`;
}
