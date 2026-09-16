/**
 * Shared response shaping + latency helpers for the auth route handlers.
 */

export function ok(data: unknown, init = 200): Response {
  return Response.json({ success: true, data }, { status: init })
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ success: false, error: { code, message } }, { status })
}

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Random small delay so the UI loading states are actually exercisable. */
export function simulateLatency(min = 300, max = 700): Promise<void> {
  const delay = min + Math.floor(Math.random() * (max - min))
  return new Promise((resolve) => setTimeout(resolve, delay))
}