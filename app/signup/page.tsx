import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/forms/signup-form"

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  )
}