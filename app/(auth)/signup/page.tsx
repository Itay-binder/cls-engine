"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, MailCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070A12]">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(56,189,248,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #7C3AED 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 w-full max-w-md mx-4">
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              background: "#101624",
              borderColor: "#1e2d45",
              boxShadow:
                "0 0 0 1px rgba(124,58,237,0.08), 0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
              style={{ background: "rgba(124,58,237,0.12)" }}
            >
              <MailCheck className="h-6 w-6" style={{ color: "#7C3AED" }} />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "#F8FAFC" }}
            >
              Check your email
            </h2>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
              We sent a confirmation link to{" "}
              <span style={{ color: "#F8FAFC" }}>{email}</span>. Open it to
              activate your CLS workspace.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #6d28d9 50%, #38BDF8 100%)",
              }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070A12]">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(56,189,248,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7C3AED 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "#101624",
            borderColor: "#1e2d45",
            boxShadow:
              "0 0 0 1px rgba(124,58,237,0.08), 0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)",
                color: "#fff",
              }}
            >
              CLS
            </span>
            <span
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: "#F8FAFC", letterSpacing: "0.2em" }}
            >
              Engine
            </span>
          </div>

          {/* Hero */}
          <h1
            className="text-2xl font-bold leading-tight mb-1"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Let the market discover your avatar.
          </h1>
          <p className="text-sm mb-7" style={{ color: "#94a3b8" }}>
            Create your CLS workspace
          </p>

          {/* Error */}
          {error && (
            <div
              className="mb-5 rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all",
                  "placeholder:text-[#334155]"
                )}
                style={{
                  background: "#070A12",
                  border: "1px solid #1e2d45",
                  color: "#F8FAFC",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#7C3AED";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(124,58,237,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1e2d45";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={cn(
                  "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all",
                  "placeholder:text-[#334155]"
                )}
                style={{
                  background: "#070A12",
                  border: "1px solid #1e2d45",
                  color: "#F8FAFC",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#7C3AED";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(124,58,237,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#1e2d45";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={cn(
                  "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all",
                  "placeholder:text-[#334155]",
                  confirmPassword && confirmPassword !== password
                    ? "border-red-500/50"
                    : ""
                )}
                style={{
                  background: "#070A12",
                  border:
                    confirmPassword && confirmPassword !== password
                      ? "1px solid rgba(239,68,68,0.4)"
                      : "1px solid #1e2d45",
                  color: "#F8FAFC",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#7C3AED";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(124,58,237,0.15)";
                }}
                onBlur={(e) => {
                  const mismatch =
                    confirmPassword && confirmPassword !== password;
                  e.currentTarget.style.borderColor = mismatch
                    ? "rgba(239,68,68,0.4)"
                    : "#1e2d45";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #6d28d9 50%, #38BDF8 100%)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(124,58,237,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating workspace..." : "Create Account"}
            </button>
          </form>

          {/* Sign in link */}
          <p
            className="text-center text-xs mt-6"
            style={{ color: "#475569" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors"
              style={{ color: "#7C3AED" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
