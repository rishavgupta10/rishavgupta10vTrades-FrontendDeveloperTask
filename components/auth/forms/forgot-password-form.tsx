"use client"

import { useState } from "react"
import { useForm, type RegisterOptions } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { AuthButton } from "@/components/ui/auth-button"
import { AlertModal } from "@/components/ui/alert-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"
import { authApi, AuthApiError } from "@/lib/api/auth"
import { emailRules } from "@/lib/validation/auth"
import { savePendingOtp } from "@/lib/auth/pending-otp"

interface ForgotPasswordFormValues {
  email: string
}

export function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get("email") || ""

  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState(defaultEmail)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const reset = await authApi.requestPasswordReset(values.email)
      setSubmittedEmail(values.email)
      savePendingOtp("forgot-password", reset.expiresAt)
      setModalOpen(true)
    } catch (err) {
      setFormError(
        err instanceof AuthApiError
          ? err.message
          : "Something went wrong. Please try again.",
      )
    }
  })

  return (
    <div className="mx-auto w-full max-w-(--form-max-width)">
      <h2 className="text-title font-semibold text-white capitalize">
        Forgot your password?
      </h2>
      <p className="mt-2 text-body text-subtle">
        Don&apos;t worry! Enter your email address, and we&apos;ll send you a link to reset it.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="navinash@workhive.com"
            hasError={!!errors.email}
            aria-describedby={errors.email ? "forgot-email-error" : undefined}
            {...register(
            "email",
            emailRules as RegisterOptions<ForgotPasswordFormValues, "email">,
          )}
          />
          {errors.email && (
            <FieldError id="forgot-email-error" message={errors.email.message} />
          )}
        </div>

        <AuthButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            "Submit"
          )}
        </AuthButton>
        {formError && <FieldError message={formError} />}
      </form>

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant="success"
        title="Link Sent Successfully!"
        description="Check your inbox! We've sent you an email with instructions to reset your password."
        action={{
          label: "Okay",
          onClick: () => {
            setModalOpen(false)
            router.push(`/verify-otp?email=${encodeURIComponent(submittedEmail)}`)
          },
        }}
      />
    </div>
  )
}