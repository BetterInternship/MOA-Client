import { cn } from "@/lib/utils";

export const CustomCard = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-[0.33em] border border-gray-300 bg-white p-[1.5em] transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
CustomCard.displayName = "Card";
export default CustomCard;
