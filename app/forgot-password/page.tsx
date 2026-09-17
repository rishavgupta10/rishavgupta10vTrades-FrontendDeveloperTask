import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forms/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
