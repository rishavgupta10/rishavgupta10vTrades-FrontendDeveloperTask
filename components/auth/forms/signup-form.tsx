"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type RegisterOptions } from "react-hook-form"
import { LoaderCircle } from "lucide-react"

import { AuthButton } from "@/components/ui/auth-button"
import { AlertModal } from "@/components/ui/alert-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"
import { PasswordInput } from "../password-input"
import { GoogleIcon, MicrosoftIcon } from "../brand-icons"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { useMicrosoftAuth } from "@/hooks/use-microsoft-auth"
import type { OAuthProfile, OAuthSuccessMeta } from "@/lib/auth/oauth"
import { authApi, AuthApiError } from "@/lib/api/auth"
import { savePendingOtp } from "@/lib/auth/pending-otp"
import {
  emailRules,
  passwordRules,
  confirmPasswordRules,
} from "@/lib/validation/auth"

interface SignUpFormValues {
  email: string
  password: string
  confirmPassword: string
}

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultEmail = searchParams.get("email") || ""
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [socialError, setSocialError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  })

  const handleOAuthSuccess = (
    profile: OAuthProfile,
    meta?: OAuthSuccessMeta,
  ) => {
    setSocialError(null)
    if (meta?.created) {
      setModalOpen(true)
      return
    }
    setSocialError(
      `An account with ${profile.email} is already registered. Please sign in instead.`,
    )
  }

  const google = useGoogleAuth({ onSuccess: handleOAuthSuccess })
  const microsoft = useMicrosoftAuth({ onSuccess: handleOAuthSuccess })

  const isLoading =
    isSubmitting || google.isLoading || microsoft.isLoading

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const reset = await authApi.signUp(values)
      savePendingOtp("signup", reset.expiresAt)
      router.push(
        `/verify-otp?email=${encodeURIComponent(values.email)}&purpose=signup`,
      )
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
      <h2 className="text-title font-bold text-white">Create account</h2>
      <p className="mt-2 text-body text-subtle">
        Set up your workspace account to get started.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="navinash@workhive.com"
            hasError={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register(
              "email",
              emailRules as RegisterOptions<SignUpFormValues, "email">,
            )}
          />
          {errors.email && (
            <FieldError id="signup-email-error" message={errors.email.message} />
          )}
        </div>

        <PasswordInput
          id="signup-password"
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          hasError={!!errors.password}
          aria-describedby={errors.password ? "signup-password-error" : undefined}
          {...register(
            "password",
            passwordRules as RegisterOptions<SignUpFormValues, "password">,
          )}
        />
        {errors.password && (
          <FieldError id="signup-password-error" message={errors.password.message} />
        )}

        <PasswordInput
          id="signup-confirm"
          label="Confirm Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          hasError={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
          {...register(
            "confirmPassword",
            confirmPasswordRules(
              () => getValues("password"),
            ) as RegisterOptions<SignUpFormValues, "confirmPassword">,
          )}
        />
        {errors.confirmPassword && (
          <FieldError
            id="signup-confirm-error"
            message={errors.confirmPassword.message}
          />
        )}

        <AuthButton type="submit" variant="primary" disabled={isLoading}>
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            "Sign Up"
          )}
        </AuthButton>
        {formError && <FieldError message={formError} />}
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-field-border" />
        <span className="text-caption text-subtle">or</span>
        <span className="h-px flex-1 bg-field-border" />
      </div>

      <div className="space-y-3">
        <AuthButton
          variant="social"
          onClick={google.signIn}
          disabled={isLoading}
        >
          {google.isLoading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <GoogleIcon className="size-5" />
          )}
          {google.isLoading ? "Redirecting to Google…" : "Continue with Google"}
        </AuthButton>
        <AuthButton
          variant="social"
          onClick={microsoft.signIn}
          disabled={isLoading}
        >
          {microsoft.isLoading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <MicrosoftIcon className="size-5" />
          )}
          {microsoft.isLoading
            ? "Redirecting to Microsoft…"
            : "Continue with Microsoft"}
        </AuthButton>
      </div>

      {(socialError || google.error || microsoft.error) && (
        <FieldError
          className="mt-4 text-center"
          message={socialError ?? google.error ?? microsoft.error ?? undefined}
        />
      )}

      <p className="mt-6 text-center text-note text-subtle">
        Already have an account?{" "}
        <a href="/" className="font-semibold text-brand hover:underline">
          Sign In
        </a>
      </p>

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant="success"
        title="Account Created!"
        description="Your WORKHIVE account is ready. Sign in to get started."
        action={{
          label: "Go to Sign In",
          onClick: () => {
            setModalOpen(false)
            router.push("/")
          },
        }}
      />
    </div>
  )
}