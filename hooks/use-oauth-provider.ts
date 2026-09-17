"use client"

import { useCallback, useEffect, useState } from "react"
import {
  isOAuthConfigured,
  buildAuthorizeUrl,
  beginOAuthRoundTrip,
  consumeOAuthProfile,
  simulateOAuth,
} from "@/lib/auth/oauth"
import type { OAuthProvider, UseOAuthOptions, UseOAuthResult } from "@/lib/auth/oauth"
import { authApi } from "@/lib/api/auth"

/**
 * Internal hook that implements the OAuth flow shared by all providers.
 *
 * When credentials are configured in `.env.local` the user is redirected to
 * the provider, then to `/auth/callback` and finally back to the originating
 * page. Otherwise a simulated exchange runs so the demo stays fully
 * interactive without configuration.
 */
export function useOAuthProvider(
  provider: OAuthProvider,
  options: UseOAuthOptions = {},
): UseOAuthResult {
  const { onSuccess, onError } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])


  useEffect(() => {
    if (typeof window === "undefined") return

    const profile = consumeOAuthProfile()
    if (profile) {
      authApi
        .syncUser({ email: profile.email, name: profile.name })
        .then((result) => {
          onSuccess?.(profile, { created: result.created })
        })
        .catch(() => {
          onSuccess?.(profile, { created: false })
        })
      return
    }

    const query = new URLSearchParams(window.location.search)
    const oauthError = query.get("oauth_error")
    if (oauthError) {
      const url = window.location.pathname
      history.replaceState(null, "", url)
      setError(oauthError)
      onError?.(new Error(oauthError))
    }
  }, [provider, onSuccess, onError])

 
  const signIn = useCallback(() => {
    setError(null)

    if (!isOAuthConfigured(provider)) {
      setIsLoading(true)
      simulateOAuth(provider)
        .then(async (profile) => {
          let created = false
          try {
            const result = await authApi.syncUser({
              email: profile.email,
              name: profile.name,
            })
            created = result.created
          } catch {
            // ignore sync failure in demo mode
          }
          setIsLoading(false)
          onSuccess?.(profile, { created })
        })
        .catch((err: unknown) => {
          setIsLoading(false)
          const msg = err instanceof Error ? err.message : "Simulation failed."
          setError(msg)
          onError?.(err instanceof Error ? err : new Error(msg))
        })
      return
    }

    const roundTrip = beginOAuthRoundTrip(provider)
    window.location.assign(buildAuthorizeUrl(provider, roundTrip))
  }, [provider, onSuccess, onError])

  return { isLoading, error, signIn, clearError }
}