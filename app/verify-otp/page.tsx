import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { OtpForm } from "@/components/auth/forms/otp-form"
import type { OtpPurpose } from "@/lib/auth/pending-otp"

interface VerifyOtpPageProps {
  searchParams: Promise<{ purpose?: string }>
}

export default async function VerifyOtpPage({
  searchParams,
}: VerifyOtpPageProps) {
  const { purpose } = await searchParams
  const otpPurpose: OtpPurpose =
    purpose === "signup" ? "signup" : "forgot-password"

  return (
    <AuthLayout>
      <Suspense>
        <OtpForm purpose={otpPurpose} />
      </Suspense>
    </AuthLayout>
  )
}