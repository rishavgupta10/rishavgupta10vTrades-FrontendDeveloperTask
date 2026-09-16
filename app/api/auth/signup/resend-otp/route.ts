import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { MockApiError, resendSignupOtp } from "@/lib/api/mock-store"
import { validateEmail } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  try {
    const reset = resendSignupOtp(String(body.email))
    return ok({
      message: "A new verification OTP has been sent to your email address.",
      otp: reset.otp,
      expiresInSeconds: reset.expiresInSeconds,
      expiresAt: reset.expiresAt,
    })
  } catch (err) {
    if (err instanceof MockApiError) {
      return fail(err.status, err.code, err.message)
    }
    throw err
  }
}