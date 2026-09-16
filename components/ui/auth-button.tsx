import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const authButtonVariants = cva(
  "inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-xl text-body font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/50",
        social:
          "border border-field-border bg-field text-white hover:bg-field/70 focus-visible:ring-white/20",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
)

interface AuthButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof authButtonVariants> {}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ className, variant, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(authButtonVariants({ variant }), className)}
        {...props}
      />
    )
  },
)

AuthButton.displayName = "AuthButton"
