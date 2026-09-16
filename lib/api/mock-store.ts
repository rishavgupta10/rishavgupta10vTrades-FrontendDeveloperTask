import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto"

/**
 * In-memory mock data store for the WORKHIVE auth flow.
 *
 * Demo users and password-reset records live in module-level Maps so every
 * route handler in a single server process shares the same state. Data resets
 * when the devserver restarts — no separate backend is required.
 *
 * Passwords are never stored in plaintext: each is salted with a random 16-byte
 * hex value and stored as `"<salt>:<sha256(salt + ':' + password)>"`.
 */

export interface MockUser {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface PasswordReset {
  email: string
  otp: string
  expiresAt: number
  attempts: number
  verified: boolean
}

export interface PasswordResetRequest {
  otp: string
  expiresInSeconds: number
  expiresAt: number
}

export interface SignupVerification {
  email: string
  passwordHash: string
  otp: string
  expiresAt: number
  attempts: number
  verified: boolean
}

export class MockApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "MockApiError"
  }
}


const MAX_OTP_ATTEMPTS = 5
const OTP_TTL_MS = Number(process.env.MOCK_OTP_TTL_MS ?? 5 * 60 * 1000)

const users = new Map<string, MockUser>()
const passwordResets = new Map<string, PasswordReset>()
const pendingSignups = new Map<string, SignupVerification>()

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex")
  return `${salt}:${digest}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":")
  if (!salt || !expected) return false
  return hashPassword(password, salt) === stored
}

function toPublicUser(user: MockUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

function insertUser(email: string, password: string): MockUser {
  const user: MockUser = {
    id: `usr_${randomUUID()}`,
    email: normalizeEmail(email),
    name: normalizeEmail(email).split("@")[0],
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  users.set(user.email, user)
  return user
}
 

/** the demo token handed out on success. */
export function createMockToken(): string {
  return `mock_${randomUUID()}`
}

export function findUserByEmail(email: string): PublicUser | null {
  const user = users.get(normalizeEmail(email))
  return user ? toPublicUser(user) : null
}

/** Upserts a user from an OAuth provider so the server knows about them. */
export function syncUser(
  email: string,
  name: string,
): { user: PublicUser; created: boolean } {
  const normalized = normalizeEmail(email)
  const existing = users.get(normalized)
  if (existing) {
    existing.name = name
    return { user: toPublicUser(existing), created: false }
  }
  const user: MockUser = {
    id: `usr_${randomUUID()}`,
    email: normalized,
    name,
    passwordHash: hashPassword(randomBytes(16).toString("hex")),
    createdAt: new Date().toISOString(),
  }
  users.set(normalized, user)
  return { user: toPublicUser(user), created: true }
}

export function createUser(email: string, password: string): PublicUser {
  const normalized = normalizeEmail(email)
  if (users.has(normalized)) {
    throw new MockApiError(
      "An account with this email already exists.",
      "DUPLICATE_EMAIL",
      409,
    )
  }
  return toPublicUser(insertUser(normalized, password))
}

export function authenticate(email: string, password: string): PublicUser | null {
  const user = users.get(normalizeEmail(email))
  if (!user || !verifyPassword(password, user.passwordHash)) return null
  return toPublicUser(user)
}

export function startPasswordReset(email: string): PasswordResetRequest {
  const normalized = normalizeEmail(email)
  const otp = String(randomInt(100000, 1000000))
  const reset: PasswordReset = {
    email: normalized,
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    verified: false,
  }
  passwordResets.set(normalized, reset)
  return {
    otp,
    expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    expiresAt: reset.expiresAt,
  }
}

export function verifyResetOtp(email: string, otp: string): void {
  const normalized = normalizeEmail(email)
  const reset = passwordResets.get(normalized)
  if (!reset) {
    throw new MockApiError(
      "No password reset was requested for this email.",
      "RESET_NOT_FOUND",
      400,
    )
  }
  reset.attempts += 1
  if (reset.attempts > MAX_OTP_ATTEMPTS || reset.expiresAt < Date.now()) {
    passwordResets.delete(normalized)
    throw new MockApiError(
      "This OTP has expired. Please request a new one.",
      "OTP_EXPIRED",
      410,
    )
  }
  if (reset.verified) {
    throw new MockApiError(
      "This OTP has already been verified.",
      "OTP_ALREADY_VERIFIED",
      400,
    )
  }
  if (reset.otp !== otp) {
    throw new MockApiError(
      "The OTP you entered is incorrect. Please try again.",
      "INVALID_OTP",
      400,
    )
  }
  reset.verified = true
  reset.otp = ""
}

export function updatePassword(email: string, newPassword: string): void {
  const normalized = normalizeEmail(email)
  const user = users.get(normalized)
  if (!user) {
    throw new MockApiError(
      "No account found for this email address.",
      "UNKNOWN_EMAIL",
      404,
    )
  }
  const reset = passwordResets.get(normalized)
  if (!reset) {
    throw new MockApiError(
      "No password reset was requested for this email.",
      "RESET_NOT_FOUND",
      400,
    )
  }
  if (!reset.verified) {
    throw new MockApiError(
      "Please verify your OTP before changing your password.",
      "RESET_NOT_VERIFIED",
      403,
    )
  }
  user.passwordHash = hashPassword(newPassword)
  passwordResets.delete(normalized)
}

export function resetMockStore(): void {
  users.clear()
  passwordResets.clear()
  pendingSignups.clear()
}

export function startSignupVerification(
  email: string,
  password: string,
): PasswordResetRequest {
  const normalized = normalizeEmail(email)
  if (users.has(normalized)) {
    throw new MockApiError(
      "An account with this email already exists.",
      "DUPLICATE_EMAIL",
      409,
    )
  }
  const otp = String(randomInt(100000, 1000000))
  pendingSignups.set(normalized, {
    email: normalized,
    passwordHash: hashPassword(password),
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    verified: false,
  })
  return {
    otp,
    expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    expiresAt: Date.now() + OTP_TTL_MS,
  }
}

export function resendSignupOtp(email: string): PasswordResetRequest {
  const normalized = normalizeEmail(email)
  const pending = pendingSignups.get(normalized)
  if (!pending) {
    throw new MockApiError(
      "No signup was requested for this email address.",
      "SIGNUP_NOT_FOUND",
      400,
    )
  }
  if (users.has(normalized)) {
    pendingSignups.delete(normalized)
    throw new MockApiError(
      "An account with this email already exists.",
      "DUPLICATE_EMAIL",
      409,
    )
  }
  const otp = String(randomInt(100000, 1000000))
  pending.otp = otp
  pending.expiresAt = Date.now() + OTP_TTL_MS
  pending.attempts = 0
  return {
    otp,
    expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    expiresAt: pending.expiresAt,
  }
}

export function verifySignupOtp(email: string, otp: string): PublicUser {
  const normalized = normalizeEmail(email)
  const pending = pendingSignups.get(normalized)
  if (!pending) {
    throw new MockApiError(
      "No signup was requested for this email address.",
      "SIGNUP_NOT_FOUND",
      400,
    )
  }
  pending.attempts += 1
  if (pending.attempts > MAX_OTP_ATTEMPTS || pending.expiresAt < Date.now()) {
    pendingSignups.delete(normalized)
    throw new MockApiError(
      "This OTP has expired. Please request a new one.",
      "OTP_EXPIRED",
      410,
    )
  }
  if (pending.verified) {
    throw new MockApiError(
      "This OTP has already been verified.",
      "OTP_ALREADY_VERIFIED",
      400,
    )
  }
  if (pending.otp !== otp) {
    throw new MockApiError(
      "The OTP you entered is incorrect. Please try again.",
      "INVALID_OTP",
      400,
    )
  }
  if (users.has(normalized)) {
    pendingSignups.delete(normalized)
    throw new MockApiError(
      "An account with this email already exists.",
      "DUPLICATE_EMAIL",
      409,
    )
  }
  const user: MockUser = {
    id: `usr_${randomUUID()}`,
    email: normalized,
    name: normalized.split("@")[0],
    passwordHash: pending.passwordHash,
    createdAt: new Date().toISOString(),
  }
  users.set(normalized, user)
  pendingSignups.delete(normalized)
  return toPublicUser(user)
}