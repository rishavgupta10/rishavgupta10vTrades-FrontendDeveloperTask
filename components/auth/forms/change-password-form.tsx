"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, type RegisterOptions } from "react-hook-form"
import { LoaderCircle } from "lucide-react"

import { AuthButton } from "@/components/ui/auth-button"
import { AlertModal } from "@/components/ui/alert-modal"
import { FieldError } from "@/components/ui/field-error"
import { PasswordInput } from "../password-input"
import { authApi, AuthApiError } from "@/lib/api/auth"
import { passwordRules, confirmPasswordRules } from "@/lib/validation/auth"

interface ChangePasswordFormValues {
  password: string
  confirmPassword: string
}

export function ChangePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ mode: "onTouched" })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await authApi.resetPassword({
        email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
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
      <h2 className="text-title font-bold text-white">
        Create New Password
      </h2>
      <p className="mt-2 text-body text-subtle">
        Choose a strong and secure password to keep your account safe.
        <br />
        Make sure it&apos;s easy for you to remember, but hard for others to guess!
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <PasswordInput
          id="new-password"
          label="New Password"
          autoComplete="new-password"
          placeholder="Enter your password"
          hasError={!!errors.password}
          aria-describedby={errors.password ? "new-password-error" : undefined}
          {...register(
            "password",
            passwordRules as RegisterOptions<ChangePasswordFormValues, "password">,
          )}
        />
        {errors.password && (
          <FieldError id="new-password-error" message={errors.password.message} />
        )}

        <PasswordInput
          id="confirm-password"
          label="Re-enter your new Password"
          autoComplete="new-password"
          placeholder="Enter your password"
          hasError={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          {...register(
            "confirmPassword",
            confirmPasswordRules(
              () => getValues("password"),
            ) as RegisterOptions<ChangePasswordFormValues, "confirmPassword">,
          )}
        />
        {errors.confirmPassword && (
          <FieldError id="confirm-password-error" message={errors.confirmPassword.message} />
        )}

        <AuthButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            "Change Password"
          )}
        </AuthButton>
        {formError && <FieldError message={formError} />}
      </form>

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant="success"
        title="Password Created!"
        description="Your password has been successfully updated. You can now use your new password to log in."
        action={{
          label: "Okay",
          onClick: () => {
            setModalOpen(false)
            router.push("/")
          },
        }}
      />
    </div>
  )
}