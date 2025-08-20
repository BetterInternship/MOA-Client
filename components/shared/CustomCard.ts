"use client";

import React, { ElementType, forwardRef, ComponentPropsWithoutRef, PropsWithChildren } from "react";

type CustomCardProps<E extends ElementType = "div"> = PropsWithChildren<{
  /** Render as another element/component (e.g. "section", "button", Link) */
  as?: E;
  className?: string;
}> &
  Omit<ComponentPropsWithoutRef<E>, "as" | "className" | "children">;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const base = "rounded-lg border bg-white p-6";

const CustomCard = forwardRef(function CustomCard<E extends ElementType = "div">(
  { as, className, ...props }: CustomCardProps<E>,
  ref: React.Ref<any>
) {
  const Comp: ElementType = as || "div";
  const finalClass = cx(base, className);

  return React.createElement(Comp as any, { ref, className: finalClass, ...props });
}) as <E extends ElementType = "div">(
  p: CustomCardProps<E> & { ref?: React.Ref<any> }
) => React.ReactElement | null;

export default CustomCard;
