import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded border border-slate-300 dark:border-slate-600 bg-background px-3 py-2 text-base placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-green-500 dark:focus-visible:border-green-400 focus-visible:ring-2 focus-visible:ring-green-500/30 dark:focus-visible:ring-green-400/30",
          "transition-smooth disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
