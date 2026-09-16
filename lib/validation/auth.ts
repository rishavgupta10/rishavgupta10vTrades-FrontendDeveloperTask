import type { RegisterOptions } from "react-hook-form"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Reusable field rules shared across every auth form. */

export const emailRules: RegisterOptions = {
  required: "Email address is required.",
  pattern: {
    value: EMAIL_REGEX,
    message: "Enter a valid email address (e.g. name@company.com).",
  },
}

export const passwordRules: RegisterOptions = {
  required: "Password is required.",
  minLength: {
    value: 8,
    message: "Password must be at least 8 characters.",
  },
  validate: (value) =>
    /[A-Za-z]/.test(String(value)) && /\d/.test(String(value)) ||
    "Password must include at least one letter and one number.",
}

/** Confirmation field rules — must equal the new password value. */
export function confirmPasswordRules(getPassword: () => string): RegisterOptions {
  return {
    required: "Please confirm your password.",
    validate: (value) => value === getPassword() || "Passwords do not match.",
  }
}