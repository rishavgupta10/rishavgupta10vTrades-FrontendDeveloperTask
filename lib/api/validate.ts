/**
 * Server-side field validation shared across the auth route handlers.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const OTP_REGEX = /^\d{6}$/

export function requireString(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required.`
  }
  return null
}

export function validateEmail(value: unknown): string | null {
  const missing = requireString(value, "Email address")
  if (missing) return missing
  if (!EMAIL_REGEX.test(String(value).trim())) {
    return "Enter a valid email address (e.g. name@company.com)."
  }
  return null
}

export function validatePassword(value: unknown): string | null {
  const missing = requireString(value, "Password")
  if (missing) return missing
  const password = String(value)
  if (password.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number."
  }
  return null
}

export function validateOtp(value: unknown): string | null {
  const missing = requireString(value, "OTP")
  if (missing) return missing
  if (!OTP_REGEX.test(String(value))) return "OTP must be a 6-digit code."
  return null
}