"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Timer } from "lucide-react"

const TIMER_ICON = <Timer aria-hidden="true" className="size-5" />

interface OtpResendProps {
  initialSeconds?: number
  onResend?: () => void
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}


export const OtpResend = memo(function OtpResend({
  initialSeconds = 30,
  onResend,
}: OtpResendProps) {
  const onResendRef = useRef(onResend)
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    onResendRef.current = onResend
  })

  const isRunning = seconds > 0

  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(() => {
      setSeconds((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isRunning])

  const handleResend = useCallback(() => {
    setSeconds(initialSeconds)
    onResendRef.current?.()
  }, [initialSeconds])

  return (
    <div className="mt-5 flex items-center">
      {isRunning ? (
        <p
          role="timer"
          aria-label={`Resend available in ${formatCountdown(seconds)}`}
          className="flex items-center gap-2 text-timer font-medium text-label"
        >
          {TIMER_ICON}
          <span>{formatCountdown(seconds)}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          className="flex items-center gap-2 text-timer font-medium text-brand transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Resend OTP
        </button>
      )}
    </div>
  )
})

OtpResend.displayName = "OtpResend"