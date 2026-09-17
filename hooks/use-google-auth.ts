"use client"

import type { UseOAuthOptions, UseOAuthResult } from "@/lib/auth/oauth"
import { useOAuthProvider } from "./use-oauth-provider"

/**
 * Google OAuth hook.
 * If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set the real redirect flow is used.
 * Otherwise a simulated exchange provides the WORKHIVE demo profile.
 */
export function useGoogleAuth(options: UseOAuthOptions = {}): UseOAuthResult {
  return useOAuthProvider("google", options)
}
