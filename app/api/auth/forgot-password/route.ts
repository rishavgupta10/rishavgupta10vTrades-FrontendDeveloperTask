import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { findUserByEmail, startPasswordReset } from "@/lib/api/mock-store"
import { validateEmail } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  const email = String(body.email).trim().toLowerCase()
  const user = findUserByEmail(email)
  if (!user) {
    return fail(404, "UNKNOWN_EMAIL", "No account found for this email address.")
  }

  const reset = startPasswordReset(email)
  return ok({
    message: "A password reset OTP has been sent to your email address.",
    otp: reset.otp,
    expiresInSeconds: reset.expiresInSeconds,
    expiresAt: reset.expiresAt,
  })
}