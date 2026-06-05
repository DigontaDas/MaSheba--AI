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
      <div>
        <label className="font-label-lg text-label-lg text-on-surface" htmlFor="email">
          Username or Email
        </label>
        <input
          autoComplete="username"
          className="mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim/30 transition duration-150"
          id="email"
          name="email"
          required
        />
      </div>
      <div>
        <label className="font-label-lg text-label-lg text-on-surface" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim/30 transition duration-150"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {clientError || state.error ? (
        <p className="rounded-lg border border-error-container bg-error-container/20 px-3 py-2 font-body-md text-body-md text-error">
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
      className="h-11 rounded-full bg-primary px-4 font-label-lg text-label-lg text-on-primary transition hover:bg-surface-tint active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
      disabled={status.pending}
      type="submit"
    >
      {status.pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
