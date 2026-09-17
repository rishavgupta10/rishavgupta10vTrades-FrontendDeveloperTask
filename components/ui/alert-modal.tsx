"use client"

import { useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { Check, X, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { AuthButton } from "@/components/ui/auth-button"

type AlertVariant = "success" | "error" | "warning" | "info"

interface AlertAction {
  label: string
  onClick?: () => void
}

interface AlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  action?: AlertAction
  variant?: AlertVariant
  dismissible?: boolean
}

const variantStyles: Record<AlertVariant, { ring: string; icon: typeof Check }> = {
  success: { ring: "bg-[#2ba431]", icon: Check },
  error: { ring: "bg-red-500", icon: X },
  warning: { ring: "bg-amber-500", icon: AlertTriangle },
  info: { ring: "bg-brand", icon: Info },
}

export function AlertModal({
  open,
  onClose,
  title,
  description,
  action,
  variant = "success",
  dismissible = false,
}: AlertModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeyDown])

  if (!open || typeof document === "undefined") return null

  const { ring, icon: Icon } = variantStyles[variant]

  const handleAction = () => {
    action?.onClick?.()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/15 p-4 "
      onClick={onClose}
      aria-hidden={false}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby={description ? "alert-modal-desc" : undefined}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[30rem] rounded-2xl bg-ink px-[clamp(1.5rem,4vw,2.75rem)] py-[clamp(1.75rem,4vw,2.5rem)] shadow-2xl ring-1 ring-white/5"
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 text-subtle transition-colors hover:text-white"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "flex size-[clamp(3.5rem,10vw,4.25rem)] items-center justify-center rounded-full",
              ring,
            )}
          >
            <Icon className="size-[clamp(1.75rem,5vw,2.25rem)] text-black" strokeWidth={3} />
          </span>

          <h2
            id="alert-modal-title"
            className="mt-6 text-modal-title font-bold text-white"
          >
            {title}
          </h2>

          {description && (
            <p
              id="alert-modal-desc"
              className="mt-3 max-w-[24rem] text-pretty text-body text-subtle"
            >
              {description}
            </p>
          )}

          {action && (
            <div className="mt-7 flex w-full justify-end">
              <AuthButton type="button" onClick={handleAction} className="h-11 w-auto px-8">
                {action.label}
              </AuthButton>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
