import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { MockApiError, verifySignupOtp } from "@/lib/api/mock-store"
import { requireString, validateEmail } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  const otpError = requireString(body.otp, "OTP")
  if (otpError) return fail(400, "MISSING_FIELD", otpError)

  try {
    const user = verifySignupOtp(String(body.email), String(body.otp))
    return ok({ verified: true, message: "Account created successfully.", user })
  } catch (err) {
    if (err instanceof MockApiError) {
      return fail(err.status, err.code, err.message)
    }
    throw err
  }
}