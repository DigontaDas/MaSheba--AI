"use client";
import { FormEvent, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { error: "" });
  const [clientError, setClientError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (email !== "admin" || password !== "admin123") {
      return;
    }

    event.preventDefault();
    setClientError("");
    const response = await fetch("/api/admin/dev-login", { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Local admin dev login failed." }));
      setClientError(payload.error || "Local admin dev login failed.");
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-5"
      aria-label="Admin login form"
      onSubmit={handleSubmit}
    >
      {/* Username or Email */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-on-surface-variant/80 font-label-lg"
          htmlFor="email"
        >
          Username or Email
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-lg px-4 text-sm bg-surface-container-lowest border border-outline-variant/60 text-on-surface outline-none transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 font-sans"
          id="email"
          name="email"
          required
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-on-surface-variant/80 font-label-lg"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="h-11 w-full rounded-lg px-4 text-sm bg-surface-container-lowest border border-outline-variant/60 text-on-surface outline-none transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 font-sans"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {/* Error message */}
      {clientError || state.error ? (
        <p className="rounded-lg px-4 py-2.5 text-sm bg-error/10 border border-error/30 text-error font-sans">
          {clientError || state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button
      className="h-11 w-full rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-1 bg-primary text-on-primary hover:bg-surface-tint focus-visible:ring-2 focus-visible:ring-primary outline-none shadow-md hover:shadow-lg disabled:bg-surface-container disabled:text-outline"
      disabled={status.pending}
      type="submit"
    >
      {status.pending ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}
