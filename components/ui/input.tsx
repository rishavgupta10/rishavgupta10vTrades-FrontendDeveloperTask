import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  endAdornment?: ReactNode
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, endAdornment, hasError, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          aria-invalid={hasError || undefined}
          className={cn(
            "h-[3.25rem] w-full rounded-xl border border-field-border bg-field",
            "px-[1.125rem] text-body text-white placeholder:text-subtle/70",
            "outline-none transition-colors",
            "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
            hasError &&
              "border-error focus-visible:border-error focus-visible:ring-error/25",
            endAdornment && "pr-12",
            className,
          )}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-3 flex items-center">{endAdornment}</div>
        ) : null}
      </div>
    )
  },
)

Input.displayName = "Input"
