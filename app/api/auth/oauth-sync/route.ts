import { fail, ok, readJsonBody, simulateLatency } from "@/lib/api/helpers"
import { createMockToken, syncUser } from "@/lib/api/mock-store"
import { requireString, validateEmail } from "@/lib/api/validate"

export async function POST(request: Request) {
  await simulateLatency()

  const body = await readJsonBody(request)
  if (!body) {
    return fail(400, "INVALID_REQUEST", "Request body must be valid JSON.")
  }

  const emailError = validateEmail(body.email)
  if (emailError) return fail(400, "INVALID_EMAIL", emailError)

  const nameError = requireString(body.name, "Name")
  if (nameError) return fail(400, "MISSING_FIELD", nameError)

  const { user, created } = syncUser(String(body.email), String(body.name).trim())
  return ok({ user, token: createMockToken(), created })
}
