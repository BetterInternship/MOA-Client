import { cn } from "@/lib/utils";
import { AlertTriangle, AlertOctagon } from "lucide-react";
import * as React from "react";

type CustomCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Visual tone; default keeps your existing white card */
  variant?: "default" | "warning" | "destructive";
  /** Show the leading icon for warning/destructive variants */
  withIcon?: boolean;
  /** Optional custom heading shown next to the icon */
  heading?: React.ReactNode;
};

/**
 * A lightly styled card with optional semantic variants.
 * - `warning`: amber tint + alert-triangle icon
 * - `destructive`: rose tint + alert-octagon icon
 */
export const CustomCard = ({
  className,
  children,
  variant = "default",
  withIcon = true,
  heading,
  ...props
}: CustomCardProps) => {
  const tone =
    variant === "warning"
      ? "border-amber-300 bg-amber-50"
      : variant === "destructive"
        ? "border-rose-300 bg-rose-50"
        : "border-gray-300 bg-white";

  const Icon =
    variant === "warning" ? AlertTriangle : variant === "destructive" ? AlertOctagon : null;

  // Give assistive tech a hint for attention states
  const role =
    props.role ??
    (variant === "destructive" ? "alert" : variant === "warning" ? "status" : undefined);

  return (
    <div
      role={role}
      className={cn("rounded-[0.33em] border p-[1.5em] transition-colors", tone, className)}
      {...props}
    >
      {Icon && withIcon && (
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Icon
            className={cn("h-4 w-4", variant === "warning" ? "text-amber-700" : "text-rose-700")}
            aria-hidden="true"
          />
          <span className={cn(variant === "warning" ? "text-amber-800" : "text-rose-800")}>
            {heading ?? (variant === "warning" ? "Warning" : "Attention")}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

CustomCard.displayName = "Card";
export default CustomCard;
