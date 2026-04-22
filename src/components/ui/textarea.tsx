import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded border border-slate-300 dark:border-slate-600 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-green-500 dark:focus-visible:border-green-400 focus-visible:ring-2 focus-visible:ring-green-500/30 dark:focus-visible:ring-green-400/30",
        "transition-smooth disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
