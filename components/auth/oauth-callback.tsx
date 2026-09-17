"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import {
  isOAuthConfigured,
  parseOAuthHash,
  profileFromIdToken,
  storeOAuthProfile,
  verifyOAuthState,
  getOAuthReturnTo,
} from "@/lib/auth/oauth"
import type { OAuthProvider } from "@/lib/auth/oauth"


export function OAuthCallback({ provider }: { provider: string }) {
  const router = useRouter()

  useEffect(() => {
    const parsed = parseOAuthHash()
    const returnTo = getOAuthReturnTo("/")
    const providerKey = provider as OAuthProvider

    const fail = (message: string) => {
      const sep = returnTo.includes("?") ? "&" : "?"
      router.replace(
        `${returnTo}${sep}oauth_error=${encodeURIComponent(message)}`,
      )
    }

    if (parsed.error || !parsed.idToken) {
      fail(parsed.errorDescription || parsed.error || "OAuth sign in failed.")
      return
    }

    if (!isOAuthConfigured(providerKey)) {
      fail("OAuth is not configured for this environment.")
      return
    }

    if (!verifyOAuthState(providerKey, parsed.state)) {
      fail("OAuth state mismatch — please try again.")
      return
    }

    const profile = profileFromIdToken(providerKey, parsed.idToken)
    if (!profile) {
      fail("Could not complete sign in — please try again.")
      return
    }

    storeOAuthProfile(profile)
    router.replace(returnTo)
  }, [provider, router])

  return (
    <main className="flex min-h-svh items-center justify-center bg-ink text-white">
      <div className="flex flex-col items-center gap-4">
        <LoaderCircle className="size-10 animate-spin text-brand" />
        <p className="text-body text-subtle">Completing sign in…</p>
      </div>
    </main>
  )
}