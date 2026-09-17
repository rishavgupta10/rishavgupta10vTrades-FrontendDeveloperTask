"use client"

import { useState } from "react"
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
import { authApi, AuthApiError } from "@/lib/api/auth"
import { emailRules, passwordRules } from "@/lib/validation/auth"

interface SignInFormValues {
  email: string
  password: string
  remember: boolean
}

export function SignInForm() {
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    mode: "onTouched",
    defaultValues: { remember: false },
  })

  const google = useGoogleAuth({
    onSuccess: () => setModalOpen(true),
  })
  const microsoft = useMicrosoftAuth({
    onSuccess: () => setModalOpen(true),
  })

  const isLoading = isSubmitting || google.isLoading || microsoft.isLoading

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
           await authApi.signIn(values)
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
      <h2 className="text-title font-semibold text-white">Sign In</h2>
      <p className="mt-2 text-body text-subtle">
        Manage your workspace seamlessly. Sign in to continue.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="navinash@workhive.com"
            hasError={!!errors.email}
            aria-describedby={errors.email ? "signin-email-error" : undefined}
            {...register(
              "email",
              emailRules as RegisterOptions<SignInFormValues, "email">,
            )}
          />
          {errors.email && (
            <FieldError id="signin-email-error" message={errors.email.message} />
          )}
        </div>

        <div className="space-y-2">
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            hasError={!!errors.password}
            aria-describedby={errors.password ? "signin-password-error" : undefined}
            {...register(
              "password",
              passwordRules as RegisterOptions<SignInFormValues, "password">,
            )}
          />
          {errors.password && (
            <FieldError id="signin-password-error" message={errors.password.message} />
          )}
         <div className="flex justify-end pt-1">
            {/* <label className="flex cursor-pointer items-center gap-2 text-caption text-label">
              <input
                type="checkbox"
                className="size-4 cursor-pointer appearance-none rounded border border-field-border bg-field checked:border-brand checked:bg-brand"
                {...register("remember")}
              />
              Remember me
            </label> */}
            <a href="/forgot-password" className="text-caption font-medium text-brand hover:underline">
              Forgot Password?
            </a>
          </div>
        </div>

        <AuthButton type="submit" variant="primary" disabled={isLoading}>
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            "Sign In"
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
          {google.isLoading ? "Redirecting to Google…" : "Sign in with Google"}
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
            : "Sign in with Microsoft"}
        </AuthButton>
      </div>

      {(google.error || microsoft.error) && (
        <FieldError
          className="mt-4 text-center"
          message={google.error ?? microsoft.error ?? undefined}
        />
      )}

      <p className="mt-6 text-center text-note text-subtle">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-semibold text-brand hover:underline">
          Sign Up
        </a>
      </p>

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant="success"
        title="Signed in successfully!"
        description="Welcome back to WORKHIVE. You are now signed in to your account."
        action={{ label: "Okay", onClick: () => setModalOpen(false) }}
      />
    </div>
  )
}