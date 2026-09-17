import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { MockApiError, updatePassword } from "@/lib/api/mock-store"
import { requireString, validateEmail, validatePassword } from "@/lib/api/validate"

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

  const confirmError = requireString(body.confirmPassword, "Confirm password")
  if (confirmError) return fail(400, "MISSING_FIELD", confirmError)

  if (String(body.password) !== String(body.confirmPassword)) {
    return fail(400, "PASSWORD_MISMATCH", "Passwords do not match.")
  }

  try {
    updatePassword(String(body.email), String(body.password))
  } catch (err) {
    if (err instanceof MockApiError) {
      return fail(err.status, err.code, err.message)
    }
    throw err
  }

  return ok({ message: "Your password has been updated successfully." })
}