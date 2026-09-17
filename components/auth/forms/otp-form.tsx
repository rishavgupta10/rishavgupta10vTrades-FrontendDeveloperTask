"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Timer } from "lucide-react";

import { AuthButton } from "@/components/ui/auth-button";
import { OtpResend, formatCountdown } from "@/components/auth/otp-resend";
import { FieldError } from "@/components/ui/field-error";
import { AlertModal } from "@/components/ui/alert-modal";
import { authApi, AuthApiError } from "@/lib/api/auth";
import {
  clearPendingOtp,
  getPendingOtp,
  savePendingOtp,
  type OtpPurpose,
} from "@/lib/auth/pending-otp";

interface OtpFormProps {
  purpose: OtpPurpose;
  length?: number;
}

export function OtpForm({ purpose, length = 6 }: OtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email");

  const [expiresAt, setExpiresAt] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return getPendingOtp()?.expiresAt ?? 0;
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const remainingSeconds = expiresAt
    ? Math.max(0, Math.floor((expiresAt - now) / 1000))
    : 0;
  const isExpired = expiresAt > 0 && remainingSeconds === 0;

  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const confirmLabel =
    purpose === "signup" ? "Account Created!" : "Verification Complete!";
  const confirmDescription =
    purpose === "signup"
      ? "Your WORKHIVE account is ready. Sign in to get started."
      : "Your email has been verified. Now create a new password.";
  const confirmActionLabel = purpose === "signup" ? "Go to Sign In" : "Continue";

  const verify = useCallback(
    async ({ email: inputEmail, otp }: { email: string; otp: string }) => {
      return purpose === "signup"
        ? authApi.verifySignupOtp({ email: inputEmail, otp })
        : authApi.verifyOtp({ email: inputEmail, otp });
    },
    [purpose],
  );

  const resend = useCallback(
    (inputEmail: string) => {
      return purpose === "signup"
        ? authApi.resendSignupOtp(inputEmail)
        : authApi.requestPasswordReset(inputEmail);
    },
    [purpose],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete || isVerifying) return;
    setFormError(null);

    if (!email) {
      setFormError("Email address is required.");
      return;
    }

    setIsVerifying(true);
    try {
      await verify({ email, otp: code });
      clearPendingOtp();
      setModalOpen(true);
    } catch (err) {
      setFormError(
        err instanceof AuthApiError
          ? err.message
          : "Unable to verify OTP. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setFormError("Email address is required.");
      return;
    }

    setFormError(null);
    try {
      const result = await resend(email);
      setDigits(Array(length).fill(""));
      if (result.expiresAt) {
        setExpiresAt(result.expiresAt);
        savePendingOtp(purpose, result.expiresAt);
      }
      setNow(Date.now());
    } catch (err) {
      setFormError(
        err instanceof AuthApiError
          ? err.message
          : "Unable to resend OTP. Please try again.",
      );
    }
  };

  const onChangeEmail = () => {
    const backPath = purpose === "signup" ? "/signup" : "/forgot-password";
    router.push(
      email
        ? `${backPath}?email=${encodeURIComponent(email)}`
        : backPath,
    );
  };

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const setDigit = (index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigit(index, "");
      return;
    }
    // Support fast typing where multiple chars land in one field.
    const chars = value.split("");
    setDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of chars) {
        if (cursor >= length) break;
        next[cursor] = char;
        cursor += 1;
      }
      return next;
    });
    const nextIndex = Math.min(index + chars.length, length - 1);
    focusInput(nextIndex);
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        focusInput(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    focusInput(Math.min(pasted.length, length - 1));
  };

  const code = digits.join("");
  const isComplete = code.length === length;

  return (
    <div className="mx-auto w-full max-w-(--form-max-width)">
      <h2 className="text-title font-bold text-white">
        {purpose === "signup" ? "Verify Your Email" : "Enter OTP"}
      </h2>
      <p className="mt-2 text-body leading-relaxed text-subtle">
        {purpose === "signup"
          ? "A verification code was sent to your email address."
          : "We sent a reset code to your email address."}{" "}
        Enter it below to continue.
      </p>

      {email && (
        <p className="mt-2 text-body leading-relaxed text-subtle">
          Sent to{" "}
          <span className="text-label">{email}</span>.{" "}
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-note font-medium text-brand hover:underline"
          >
            Change email
          </button>
        </p>
      )}

      <form className="mt-6" onSubmit={handleSubmit} noValidate>
        <div className="flex gap-[clamp(0.5rem,1.5vw,0.875rem)]">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Digit ${index + 1}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className="h-[clamp(2.75rem,4vw,3.25rem)] w-full min-w-0 rounded-xl border border-field-border bg-field text-center text-lg font-semibold text-white outline-none transition-colors placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/40"
              placeholder="0"
            />
          ))}
        </div>

        <OtpResend onResend={handleResend} />

        {expiresAt > 0 && (
          <p
            role="timer"
            aria-label={`OTP expires in ${formatCountdown(remainingSeconds)}`}
            className={`mt-4 flex items-center gap-2 text-timer font-medium ${remainingSeconds <= 30 ? "text-error" : "text-label"}`}
          >
            <Timer aria-hidden="true" className="size-5 shrink-0" />
            {remainingSeconds > 0 ? (
              <>{remainingSeconds <= 30 ? "Expiring soon \u2014 " : "Code expires in "}{formatCountdown(remainingSeconds)}</>
            ) : (
              "This OTP has expired. Please resend a new code."
            )}
          </p>
        )}

        {formError && <FieldError className="mt-4" message={formError} />}

        <AuthButton
          type="submit"
          variant="primary"
          className="mt-6"
          disabled={digits.some((digit) => !digit) || isVerifying || isExpired}
        >
          {isVerifying ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            "Verify OTP"
          )}
        </AuthButton>
      </form>

      <p className="text-md text-indigo-500/80 my-3">
        <b>Note:</b> Get the valid OTP from the network tab in dev tools. This is just for development purposes. In Production you'll receive it via email or SMS.
      </p>

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variant="success"
        title={confirmLabel}
        description={confirmDescription}
        action={{
          label: confirmActionLabel,
          onClick: () => {
            setModalOpen(false);
            router.push(
              purpose === "signup"
                ? "/"
                : `/change-password?email=${encodeURIComponent(email ?? "")}`,
            );
          },
        }}
      />
    </div>
  );
}