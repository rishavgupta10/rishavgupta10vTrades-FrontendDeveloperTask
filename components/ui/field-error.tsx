import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface FieldErrorProps {
  id?: string
  message?: string
  className?: string
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-1.5 pt-1.5 text-caption leading-snug text-error",
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}