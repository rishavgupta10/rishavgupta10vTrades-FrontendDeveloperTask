import { OAuthCallback } from "@/components/auth/oauth-callback"

export default async function OAuthCallbackPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params

  return <OAuthCallback provider={provider} />
}