import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { ChangePasswordForm } from "@/components/auth/forms/change-password-form"

export default function ChangePasswordPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ChangePasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
