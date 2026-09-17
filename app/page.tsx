import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/forms/sign-in-form"

export default function Page() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  )
}
