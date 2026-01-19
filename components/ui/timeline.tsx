import React from "react";
import { CheckIcon } from "lucide-react";

export const Timeline = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-1">{children}</div>;
};

interface TimelineItemProps {
  number: number;
  title: string | React.ReactNode;
  subtitle?: React.ReactNode;
  isLast?: boolean;
  children?: React.ReactNode;
}

export const TimelineItem = ({
  number,
  title,
  subtitle,
  isLast = false,
  children,
}: TimelineItemProps) => {
  const isCheckmark = number === -1;

  return (
    <div className="flex gap-2.5">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Circle or Checkmark */}
        {isCheckmark ? (
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
            <CheckIcon className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="bg-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
            {number}
          </div>
        )}
        {/* Line to next item */}
        {!isLast && <div className="mt-0.5 h-5 w-0.5 bg-gray-200" />}
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
};
