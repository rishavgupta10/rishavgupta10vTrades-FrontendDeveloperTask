export type OAuthProvider = "google" | "microsoft"

export interface OAuthProfile {
  provider: OAuthProvider
  id: string
  name: string
  email: string
}

export interface OAuthSuccessMeta {
  created: boolean
}

export interface UseOAuthOptions {
  onSuccess?: (profile: OAuthProfile, meta?: OAuthSuccessMeta) => void
  onError?: (error: Error) => void
}

export interface UseOAuthResult {
  isLoading: boolean
  error: string | null
  signIn: () => void
  clearError: () => void
}

interface ProviderConfig {
  provider: OAuthProvider
  clientId?: string
  tenantId?: string
  authorizeUrl: string
  scopes: string[]
  redirectPath: string
  stateKey: string
  nonceKey: string
  mockProfile: OAuthProfile
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
const MICROSOFT_TENANT_ID = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID

export const OAUTH_REDIRECT_PATH = "/auth/callback"

const OAUTH_PROFILE_KEY = "workhive.oauth.profile"
const OAUTH_RETURN_TO_KEY = "workhive.oauth.returnTo"

function resolveOrigin(): string {
  if (typeof window === "undefined") return ""
  return window.location.origin
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    provider: "google",
    clientId: GOOGLE_CLIENT_ID,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["openid", "email", "profile"],
    redirectPath: `${OAUTH_REDIRECT_PATH}/google`,
    stateKey: "workhive.oauth.google.state",
    nonceKey: "workhive.oauth.google.nonce",
    mockProfile: {
      provider: "google",
      id: "google-demo-user-01",
      name: "Ana Sharma",
      email: "anasharma.demo@gmail.com",
    },
  },
  microsoft: {
    provider: "microsoft",
    clientId: MICROSOFT_CLIENT_ID,
    tenantId: MICROSOFT_TENANT_ID,
    authorizeUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    scopes: ["openid", "email", "profile"],
    redirectPath: `${OAUTH_REDIRECT_PATH}/microsoft`,
    stateKey: "workhive.oauth.microsoft.state",
    nonceKey: "workhive.oauth.microsoft.nonce",
    mockProfile: {
      provider: "microsoft",
      id: "microsoft-demo-user-01",
      name: "Navin Ash",
      email: "navinash@workhive.com",
    },
  },
}

export function isOAuthConfigured(provider: OAuthProvider): boolean {
  return Boolean(PROVIDERS[provider].clientId)
}

export function getProviderConfig(provider: OAuthProvider): ProviderConfig {
  return PROVIDERS[provider]
}

function randomToken(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let out = ""
  const bytes = new Uint8Array(length)
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  options: { state: string; nonce: string },
): string {
  const config = PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: config.clientId as string,
    response_type: "id_token token",
    redirect_uri: `${resolveOrigin()}${config.redirectPath}`,
    scope: config.scopes.join(" "),
    state: options.state,
    nonce: options.nonce,
    prompt: "select_account",
  })
  const base = config.authorizeUrl.replace("{tenant}", config.tenantId ?? "common")
  return `${base}?${params.toString()}`
}

export interface OAuthRoundTrip {
  state: string
  nonce: string
}

export function beginOAuthRoundTrip(provider: OAuthProvider): OAuthRoundTrip {
  const config = PROVIDERS[provider]
  const roundTrip = { state: randomToken(), nonce: randomToken() }
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(config.stateKey, roundTrip.state)
    window.sessionStorage.setItem(config.nonceKey, roundTrip.nonce)
    // Remember the page the user signed in from so the callback can return.
    window.sessionStorage.setItem(
      OAUTH_RETURN_TO_KEY,
      window.location.pathname + window.location.search,
    )
  }
  return roundTrip
}

export function getOAuthReturnTo(defaultPath = "/"): string {
  if (typeof window === "undefined") return defaultPath
  return window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY) || defaultPath
}

export function storeOAuthProfile(profile: OAuthProfile): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(OAUTH_PROFILE_KEY, JSON.stringify(profile))
}

export function consumeOAuthProfile(): OAuthProfile | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(OAUTH_PROFILE_KEY)
  if (!raw) return null
  window.sessionStorage.removeItem(OAUTH_PROFILE_KEY)
  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY)
  try {
    return JSON.parse(raw) as OAuthProfile
  } catch {
    return null
  }
}

interface OAuthHashResponse {
  error?: string
  errorDescription?: string
  accessToken?: string
  idToken?: string
  state?: string
}

export function parseOAuthHash(): OAuthHashResponse {
  if (typeof window === "undefined") return {}
  const raw = window.location.hash.replace(/^#/, "")
  if (!raw) return {}
  const params = new URLSearchParams(raw)
  return {
    error: params.get("error") ?? undefined,
    errorDescription: params.get("error_description") ?? undefined,
    accessToken: params.get("access_token") ?? undefined,
    idToken: params.get("id_token") ?? undefined,
    state: params.get("state") ?? undefined,
  }
}

export function verifyOAuthState(
  provider: OAuthProvider,
  returnedState?: string,
): boolean {
  if (typeof window === "undefined") return true
  const stored = window.sessionStorage.getItem(PROVIDERS[provider].stateKey)
  if (!stored) return true
  window.sessionStorage.removeItem(PROVIDERS[provider].stateKey)
  window.sessionStorage.removeItem(PROVIDERS[provider].nonceKey)
  return Boolean(returnedState && returnedState === stored)
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function profileFromIdToken(
  provider: OAuthProvider,
  idToken: string,
): OAuthProfile | null {
  const claims = decodeJwtPayload(idToken)
  if (!claims) return null
  const preferredName = claims.preferred_username
  const email = typeof claims.email === "string" ? claims.email : ""
  const name =
    typeof claims.name === "string"
      ? claims.name
      : typeof preferredName === "string"
        ? preferredName
        : email.split("@")[0] || "WORKHIVE User"
  const id = typeof claims.sub === "string" ? claims.sub : email
  return { provider, id, name, email }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Simulates the provider hand-shake so the demo works without OAuth creds. */
export async function simulateOAuth(provider: OAuthProvider): Promise<OAuthProfile> {
  await delay(1200)
  return { ...PROVIDERS[provider].mockProfile }
}