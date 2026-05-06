/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-16 22:43:51
 * @ Modified time: 2026-01-05 16:24:38
 * @ Description:
 *
 * The field renderer 3000 automatically renders the correct field for the situation!
 */

"use client";

import { useSignContext } from "@/app/docs/auth/provider/sign.ctx";
import {
  FormCheckbox,
  FormDatePicker,
  FormDropdown,
  FormInput,
  FormTextarea,
  TimeInputNative,
} from "./EditForm";
import { AutocompleteTreeMulti, TreeOption } from "./autocomplete";
import { ClientField } from "@betterinternship/core/forms";
import { useEffect, useRef, useState } from "react";
import { Eye, ImageUp, PenLine, Trash2, Type } from "lucide-react";
import {
  createSignatureImageValue,
  getSignatureImageFieldKey,
  parseSignatureImageValue,
  serializeSignatureImageValue,
  type SignatureImageValue,
} from "@betterinternship/core/forms";

export const FieldRenderer = <T extends any[]>({
  field,
  value = "",
  onChange,
  onAuxValueChange,
  error,
  onBlur,
  allValues,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  onChange: (v: any) => void;
  onAuxValueChange?: (key: string, value: any) => void;
  error?: string;
  onBlur?: (nextValue?: unknown) => void;
  allValues?: Record<string, string>;
  isPhantom?: boolean;
}) => {
  // Placeholder or error
  const TooltipLabel = () => {
    if (error) return <p className="text-destructive mt-1 text-xs">{error}</p>;
    return null;
  };

  // Dropdown
  if (field.type === "dropdown") {
    return (
      <FieldRendererDropdown
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  // Date
  if (field.type === "date") {
    return (
      <FieldRendererDate
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  // Time
  if (field.type === "time") {
    return (
      <FieldRendererTime
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <FieldRendererTextarea
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  if (field.type === "multiselect") {
    return (
      <FieldRendererMultiselect
        field={field}
        values={value.split("\n")}
        TooltipContent={TooltipLabel}
        onChange={(s) => onChange(s.join("\n"))}
        options={
          field.options?.map((o) => ({
            name: o as string,
            value: o as string,
          })) ?? []
        }
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  // Checkboxes
  if (field.type === "checkbox") {
    return (
      <FieldRendererCheckbox
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onBlur={onBlur}
        isPhantom={isPhantom}
      />
    );
  }

  // Signatures
  if (field.type === "signature") {
    return (
      <FieldRendererSignature
        field={field}
        value={value}
        TooltipContent={TooltipLabel}
        onChange={onChange}
        onAuxValueChange={onAuxValueChange}
        onBlur={onBlur}
        allValues={allValues}
      />
    );
  }

  return (
    <FieldRendererInput
      field={field}
      value={value}
      TooltipContent={TooltipLabel}
      onChange={onChange}
      onBlur={onBlur}
      isPhantom={isPhantom}
    />
  );
};

/**
 * Subtle icon for phantom fields (not visible in PDF)
 */
const PhantomFieldBadge = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex">
      <Eye
        size={14}
        className="cursor-help text-gray-300 transition-colors hover:text-gray-400"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div className="pointer-events-none absolute top-1/2 right-full z-10 mr-2 -translate-y-1/2 transform rounded bg-gray-700 px-2 py-1 text-xs whitespace-nowrap text-white">
          Not visible in PDF
          <div className="absolute top-1/2 left-full -translate-y-1/2 transform border-4 border-transparent border-l-gray-700"></div>
        </div>
      )}
    </div>
  );
};

// ! Probably migrate this in the future
interface Option {
  id: string;
  name: string;
}

/**
 * Dropdown
 *
 * @component
 */
const FieldRendererDropdown = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: string | number) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const options: Option[] = (field.options ?? []).map((o) => ({
    id: o as string,
    name: o as string,
  }));

  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="relative space-y-1.5 overflow-visible">
      <FormDropdown
        required={false}
        label={field.label}
        value={value}
        options={options}
        setter={(v) => onChange(v)}
        className="w-full"
        tooltip={field.tooltip_label}
        onBlur={() => onBlur?.()}
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Date input
 *
 * @component
 */
const FieldRendererDate = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: number) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  // Try to parse it first
  const numericalValue = isNaN(parseInt(value)) ? 0 : parseInt(value);

  const badge = isPhantom && <PhantomFieldBadge />;

  // By default the unix timestamp is 0 if it's not a number
  return (
    <div className="space-y-1.5">
      <FormDatePicker
        required={false}
        label={field.label}
        date={numericalValue}
        setter={(v) => {
          const resolved = v ?? 0;
          onChange(resolved);
          onBlur?.(resolved);
        }}
        className="w-full"
        contentClassName="z-[1100]"
        placeholder="Select date"
        autoClose
        disabledDays={[]}
        tooltip={field.tooltip_label}
        format={(d) =>
          d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        }
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Time input
 *
 * @component
 */
const FieldRendererTime = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: string) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="space-y-1.5">
      <TimeInputNative
        required={false}
        label={field.label}
        value={value}
        tooltip={field.tooltip_label}
        onChange={(v) => onChange(v ?? "")}
        onBlur={() => onBlur?.()}
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Checkbox input
 *
 * @component
 */
const FieldRendererCheckbox = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: boolean) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="space-y-1.5">
      <FormCheckbox
        required={false}
        label={field.label}
        checked={!!value}
        tooltip={field.tooltip_label}
        sentence={field.tooltip_label}
        setter={(c: boolean) => onChange(c)}
        onBlur={() => onBlur?.()}
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Generic input
 *
 * @component
 */
const FieldRendererInput = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: string | number) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const inputMode = field.type === "number" ? "numeric" : undefined;
  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="space-y-1.5">
      <FormInput
        required={false}
        label={field.label}
        value={value ?? ""}
        setter={(v) => {
          if (inputMode !== "numeric") return onChange(v);
          const next = v.trim() === "" ? 0 : parseInt(v);
          if (!isNaN(next)) onChange(next);
        }}
        inputMode={inputMode}
        tooltip={field.tooltip_label}
        className="w-full"
        onBlur={() => onBlur?.()}
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Signature-specific input
 *
 * @component
 */
const FieldRendererSignature = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onAuxValueChange,
  onBlur,
  allValues = {},
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: string | number) => void;
  onAuxValueChange?: (key: string, value: any) => void;
  onBlur?: (nextValue?: unknown) => void;
  allValues?: Record<string, string>;
}) => {
  const signContext = useSignContext();
  const [checked, setChecked] = useState(false);
  const imageFieldKey = getSignatureImageFieldKey(field.field);
  const currentSignatureImage = parseSignatureImageValue(allValues[imageFieldKey]);
  const [mode, setMode] = useState<"type" | "upload" | "draw">(
    currentSignatureImage?.source === "draw"
      ? "draw"
      : currentSignatureImage?.source === "upload"
        ? "upload"
        : "type"
  );
  const [typedName, setTypedName] = useState(value || "");
  const [uploadError, setUploadError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // ! PUT THIS SOMEWHERE ELSE
  useEffect(() => {
    signContext.setHasAgreedForSignature(field.field, value, checked);
  }, [checked, value]);

  useEffect(() => {
    const parsed = parseSignatureImageValue(allValues[imageFieldKey]);
    if (parsed) {
      setMode(parsed.source);
    }

    setTypedName(value || "");
  }, [allValues, imageFieldKey, value]);

  const emitSignatureImage = (nextImage: SignatureImageValue) => {
    onAuxValueChange?.(imageFieldKey, serializeSignatureImageValue(nextImage));
  };

  const getSignatureImageSrc = (signature: SignatureImageValue | null) => {
    if (!signature) return "";
    if (signature.image.storage === "bucket") {
      return signature.image.signedUrl || signature.image.publicUrl || "";
    }
    return signature.image.dataUrl;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawImageOnCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const image = new Image();
    image.onload = () => {
      clearCanvas();
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      ctx.drawImage(image, x, y, width, height);
    };
    image.src = dataUrl;
  };

  useEffect(() => {
    if (mode !== "draw") return;
    window.requestAnimationFrame(() => {
      const latestImage = parseSignatureImageValue(allValues[imageFieldKey]);
      if (latestImage?.source === "draw") {
        const src = getSignatureImageSrc(latestImage);
        if (!src) {
          clearCanvas();
          return;
        }
        drawImageOnCanvas(src);
        return;
      }
      clearCanvas();
    });
  }, [allValues, imageFieldKey, mode]);

  const handleTypedNameChange = (nextName: string) => {
    setTypedName(nextName);
    onChange(nextName);
  };

  const clearSignatureImage = () => {
    setUploadError("");
    clearCanvas();
    onAuxValueChange?.(imageFieldKey, "");
  };

  const handleUpload = (file: File | undefined) => {
    if (!file) return;

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setUploadError("Please upload a PNG or JPEG signature image.");
      return;
    }

    const mimeType = file.type as "image/png" | "image/jpeg";
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      emitSignatureImage(
        createSignatureImageValue({
          source: "upload",
          dataUrl,
          mimeType,
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const exportCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    emitSignatureImage(
      createSignatureImageValue({
        source: "draw",
        dataUrl: canvas.toDataURL("image/png"),
        mimeType: "image/png",
      })
    );
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleDrawStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!canvas || !ctx || !point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handleDrawMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const point = getCanvasPoint(event);
    if (!ctx || !point) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handleDrawEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    exportCanvasSignature();
  };

  const signatureImage = parseSignatureImageValue(allValues[imageFieldKey]);
  const ModeButton = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={`inline-flex h-8 items-center gap-1.5 rounded-[0.33em] border px-2.5 text-xs font-medium transition-colors ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-1.5 rounded-[0.33em] border border-gray-300 p-4 px-5">
      <FormInput
        required={true}
        label={`${field.label} (Signatory Full Name)`}
        value={typedName ?? ""}
        setter={handleTypedNameChange}
        tooltip={field.tooltip_label}
        className="w-full"
        onBlur={() => onBlur?.(value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ModeButton
          active={mode === "type"}
          onClick={() => {
            setMode("type");
            clearSignatureImage();
          }}
        >
          <Type className="h-3.5 w-3.5" />
          Type
        </ModeButton>
        <label
          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[0.33em] border px-2.5 text-xs font-medium transition-colors ${
            mode === "upload"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ImageUp className="h-3.5 w-3.5" />
          Upload
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event) => {
              setMode("upload");
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <ModeButton
          active={mode === "draw"}
          onClick={() => {
            setMode("draw");
            setUploadError("");
          }}
        >
          <PenLine className="h-3.5 w-3.5" />
          Draw
        </ModeButton>
        {signatureImage ? (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[0.33em] border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
            onClick={clearSignatureImage}
            title="Clear signature image"
            aria-label="Clear signature image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      {mode === "upload" && signatureImage && getSignatureImageSrc(signatureImage) ? (
        <div className="mt-3 flex h-32 items-center justify-center rounded-[0.33em] border border-slate-200 bg-white p-2">
          <img
            src={getSignatureImageSrc(signatureImage)}
            alt="Uploaded signature"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : null}
      {mode === "draw" ? (
        <div className="mt-3 space-y-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={220}
            className="h-36 w-full touch-none rounded-[0.33em] border border-slate-300 bg-white"
            onPointerDown={handleDrawStart}
            onPointerMove={handleDrawMove}
            onPointerUp={handleDrawEnd}
            onPointerCancel={() => {
              isDrawingRef.current = false;
            }}
          />
          <button
            type="button"
            className="rounded-[0.33em] border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={() => {
              clearCanvas();
              clearSignatureImage();
            }}
          >
            Clear drawing
          </button>
        </div>
      ) : null}
      <div className="mt-5 flex flex-row" onClick={() => setChecked(!checked)}>
        <div className="mt-1 mr-2">
          <FormCheckbox checked={checked} setter={setChecked}></FormCheckbox>
        </div>
        <span className="text-md text-gray-700 italic">
          I agree to use electronic representation of my signature for all purposes when I (or my
          agent) use them on documents, including legally binding contracts.
        </span>
      </div>
      <TooltipContent />
    </div>
  );
};

/**
 * Textarea input
 *
 * @component
 */
const FieldRendererTextarea = <T extends any[]>({
  field,
  value,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  value: string;
  TooltipContent: () => React.ReactNode;
  onChange: (v: string | number) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="space-y-1.5">
      <FormTextarea
        required={false}
        label={field.label}
        value={value ?? ""}
        setter={onChange}
        onBlur={() => onBlur?.()}
        tooltip={field.tooltip_label}
        className="w-full"
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};

/**
 * Multiselect input
 *
 * @component
 */
const FieldRendererMultiselect = <T extends any[]>({
  field,
  values,
  options,
  TooltipContent,
  onChange,
  onBlur,
  isPhantom = false,
}: {
  field: ClientField<T>;
  values: string[];
  options: TreeOption[];
  TooltipContent: () => React.ReactNode;
  onChange: (v: string[]) => void;
  onBlur?: (nextValue?: unknown) => void;
  isPhantom?: boolean;
}) => {
  const badge = isPhantom && <PhantomFieldBadge />;

  return (
    <div className="space-y-1.5" onBlur={() => onBlur?.()}>
      <AutocompleteTreeMulti
        required={false}
        label={field.label}
        value={values ?? []}
        setter={onChange}
        className="w-full"
        tooltip={field.tooltip_label}
        tree={options}
        labelAddon={badge}
      />
      <TooltipContent />
    </div>
  );
};
