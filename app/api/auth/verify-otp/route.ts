import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { MockApiError, verifyResetOtp } from "@/lib/api/mock-store"
import { validateEmail, validateOtp } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  const otpError = validateOtp(body.otp)
  if (otpError) return fail(400, "INVALID_OTP", otpError)

  try {
    verifyResetOtp(String(body.email), String(body.otp))
  } catch (err) {
    if (err instanceof MockApiError) {
      return fail(err.status, err.code, err.message)
    }
    throw err
  }

  return ok({ verified: true, message: "OTP verified successfully." })
}