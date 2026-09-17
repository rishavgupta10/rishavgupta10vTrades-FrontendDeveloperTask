import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import {
  authenticate,
  createMockToken,
} from "@/lib/api/mock-store"
import { requireString } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const fieldError =
    requireString(body.email, "Email address") ||
    requireString(body.password, "Password")
  if (fieldError) return fail(400, "MISSING_FIELD", fieldError)

  const user = authenticate(String(body.email), String(body.password))
  if (!user) {
    return fail(401, "INVALID_CREDENTIALS", "Invalid email or password.")
  }

  return ok({ user, token: createMockToken() })
}