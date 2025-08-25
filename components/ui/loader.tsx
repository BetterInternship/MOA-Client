import { cn } from "@/lib/utils";

/**
 * A reusable loader.
 *
 * @component
 */
export const Loader = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full items-center justify-center py-16">
      <div className="animate-scale-in text-center">
        <div
          className={cn(
            "border-primary mx-auto h-10 w-10 animate-spin rounded-full border-b-2",
            children ? "mb-4" : ""
          )}
        ></div>
        {children}
      </div>
    </div>
  );
};
