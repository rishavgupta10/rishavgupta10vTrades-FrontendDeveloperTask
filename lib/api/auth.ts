export interface Credentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthResult {
  user: AuthUser
  token: string
}

export interface ResetOtp {
  otp: string
  expiresInSeconds: number
  expiresAt: number
}


export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "AuthApiError"
  }
}

async function apiRequest<T>(path: string, payload: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AuthApiError(
      "Network error. Please check your connection and try again.",
    )
  }

  const json = await response.json().catch(() => null)
  if (!response.ok || json?.success !== true) {
    const error = (json?.error ?? {}) as { code?: string; message?: string }
    throw new AuthApiError(
      error.message ?? "Something went wrong. Please try again.",
      error.code,
      response.status,
    )
  }

  return (json as { data: T }).data
}

export interface SyncResult {
  user: AuthUser
  token: string
  created: boolean
}

export const authApi = {
  signIn: (credentials: Credentials): Promise<AuthResult> =>
    apiRequest<AuthResult>("/api/auth/signin", credentials),

  signUp: (credentials: Credentials): Promise<ResetOtp> =>
    apiRequest<ResetOtp>("/api/auth/signup", credentials),

  verifySignupOtp: (input: {
    email: string
    otp: string
  }): Promise<{ verified: boolean; message: string; user: AuthUser }> =>
    apiRequest<{ verified: boolean; message: string; user: AuthUser }>(
      "/api/auth/signup/verify-otp",
      input,
    ),

  resendSignupOtp: (email: string): Promise<ResetOtp> =>
    apiRequest<ResetOtp>("/api/auth/signup/resend-otp", { email }),

  requestPasswordReset: (email: string): Promise<ResetOtp> =>
    apiRequest<ResetOtp>("/api/auth/forgot-password", { email }),

  verifyOtp: (input: { email: string; otp: string }): Promise<{ verified: boolean }> =>
    apiRequest<{ verified: boolean }>("/api/auth/verify-otp", input),

  resetPassword: (input: {
    email: string
    password: string
    confirmPassword: string
  }): Promise<{ message: string }> =>
    apiRequest<{ message: string }>("/api/auth/change-password", input),

  syncUser: (input: { email: string; name: string }): Promise<SyncResult> =>
    apiRequest<SyncResult>("/api/auth/oauth-sync", input),
}