export type OtpPurpose = "forgot-password" | "signup"

interface PendingOtp {
  purpose: OtpPurpose
  expiresAt: number
}

const PENDING_OTP_KEY = "workhive.auth.pendingOtp"



export function savePendingOtp(purpose: OtpPurpose, expiresAt: number): void {
  if (typeof window === "undefined") return
  const data: PendingOtp = { purpose, expiresAt }
  window.sessionStorage.setItem(PENDING_OTP_KEY, JSON.stringify(data))
}

export function getPendingOtp(): PendingOtp | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(PENDING_OTP_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PendingOtp>
    if (
      (parsed.purpose === "forgot-password" || parsed.purpose === "signup") &&
      typeof parsed.expiresAt === "number" &&
      Number.isFinite(parsed.expiresAt) &&
      parsed.expiresAt > 0
    ) {
      return { purpose: parsed.purpose, expiresAt: parsed.expiresAt }
    }
  } catch {
    // fall through — corrupted value is ignored
  }
  return null
}

export function clearPendingOtp(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(PENDING_OTP_KEY)
}