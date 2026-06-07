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
          className="text-sm font-medium"
          htmlFor="email"
          style={{ color: "rgba(195, 220, 220, 0.85)", fontFamily: "var(--font-work-sans)" }}
        >
          Username or Email
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-lg px-4 text-sm outline-none transition-all duration-150"
          id="email"
          name="email"
          required
          style={{
            background: "#0d1818",
            border: "1px solid rgba(78, 205, 196, 0.2)",
            color: "#e8f5f5",
            fontFamily: "var(--font-hind-siliguri)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(78, 205, 196, 0.65)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78, 205, 196, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(78, 205, 196, 0.2)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium"
          htmlFor="password"
          style={{ color: "rgba(195, 220, 220, 0.85)", fontFamily: "var(--font-work-sans)" }}
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="h-11 w-full rounded-lg px-4 text-sm outline-none transition-all duration-150"
          id="password"
          name="password"
          required
          type="password"
          style={{
            background: "#0d1818",
            border: "1px solid rgba(78, 205, 196, 0.2)",
            color: "#e8f5f5",
            fontFamily: "var(--font-hind-siliguri)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(78, 205, 196, 0.65)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78, 205, 196, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(78, 205, 196, 0.2)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Error message */}
      {clientError || state.error ? (
        <p
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: "rgba(186, 26, 26, 0.12)",
            border: "1px solid rgba(186, 26, 26, 0.3)",
            color: "#ff8a80",
            fontFamily: "var(--font-hind-siliguri)",
          }}
        >
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
      className="h-11 w-full rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
      disabled={status.pending}
      type="submit"
      style={{
        background: status.pending
          ? "rgba(78, 205, 196, 0.6)"
          : "linear-gradient(90deg, #3ec9c0 0%, #4ecdc4 100%)",
        color: "#051414",
        fontFamily: "var(--font-work-sans)",
        boxShadow: status.pending
          ? "none"
          : "0 0 20px rgba(78, 205, 196, 0.35), 0 4px 12px rgba(78, 205, 196, 0.2)",
      }}
      onMouseEnter={(e) => {
        if (!status.pending) {
          e.currentTarget.style.boxShadow = "0 0 32px rgba(78, 205, 196, 0.55), 0 8px 20px rgba(78, 205, 196, 0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!status.pending) {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(78, 205, 196, 0.35), 0 4px 12px rgba(78, 205, 196, 0.2)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
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
