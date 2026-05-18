"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070A12]">
      {/* Background glow effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(56,189,248,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Dot grid pattern */}
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
          {/* Logo / wordmark */}
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
            Sign in to your CLS workspace
          </p>

          {/* Error banner */}
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium"
                  style={{ color: "#94a3b8" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "#7C3AED" }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #6d28d9 50%, #38BDF8 100%)",
                backgroundSize: "200% 200%",
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center my-5">
            <div
              className="flex-1 h-px"
              style={{ background: "#1e2d45" }}
            />
            <span
              className="mx-3 text-xs"
              style={{ color: "#475569" }}
            >
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "#1e2d45" }}
            />
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "transparent",
              border: "1px solid #1e2d45",
              color: "#F8FAFC",
            }}
            onMouseEnter={(e) => {
              if (!googleLoading) {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.background = "rgba(248,250,252,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1e2d45";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Sign up link */}
          <p
            className="text-center text-xs mt-6"
            style={{ color: "#475569" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: "#7C3AED" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
