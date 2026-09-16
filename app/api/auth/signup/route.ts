import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import {
  MockApiError,
  startSignupVerification,
} from "@/lib/api/mock-store"
import { validateEmail, validatePassword } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  const passwordError = validatePassword(body.password)
  if (passwordError) return fail(400, "INVALID_PASSWORD", passwordError)

  try {
    const verification = startSignupVerification(
      String(body.email),
      String(body.password),
    )
    return ok({
      message: "A verification OTP has been sent to your email address.",
      otp: verification.otp,
      expiresInSeconds: verification.expiresInSeconds,
      expiresAt: verification.expiresAt,
    })
  } catch (err) {
    if (err instanceof MockApiError) {
      return fail(err.status, err.code, err.message)
    }
    throw err
  }
}