"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [standalone, setStandalone] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "sent" | "verifying" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
  }, []);

  async function handleSendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage(
        standalone
          ? "Check your email for a 6-digit code and enter it below — that keeps you signed in on the home screen app."
          : "Check your email for a magic link, or enter the 6-digit code below."
      );
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not send magic link. Check your Supabase env vars."
      );
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = otp.trim();
    if (!token) return;

    setStatus("verifying");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      // Session cookies are now set in THIS browsing context (including the
      // iOS standalone PWA cookie jar, which Safari does not share).
      router.replace("/");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Could not verify that code."
      );
    }
  }

  const showOtpStep = status === "sent" || status === "verifying" || status === "error";

  return (
    <div className="flex w-full flex-col gap-4">
      {standalone ? (
        <p className="rounded-xl bg-[var(--sun)]/25 px-3 py-2 text-xs leading-relaxed text-[var(--ink)]/75">
          On the home screen app, use the <strong>email code</strong> below
          instead of the magic link. Links open in Safari, which has a separate
          sign-in from this app on iPhone.
        </p>
      ) : null}

      <form onSubmit={handleSendLink} className="flex w-full flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--ink)]">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border-2 border-[var(--ink)]/15 bg-white/80 px-4 py-3 text-base text-[var(--ink)] outline-none transition focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/20"
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="rounded-xl bg-[var(--coral)] px-4 py-3 text-base font-semibold text-white shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--ink)]"
        >
          {status === "loading"
            ? "Sending…"
            : status === "sent" || status === "verifying"
              ? "Resend code"
              : "Send sign-in code"}
        </button>
      </form>

      {showOtpStep ? (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 border-t border-[var(--ink)]/8 pt-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--ink)]">
            6-digit code
            <input
              type="text"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
              placeholder="123456"
              className="rounded-xl border-2 border-[var(--ink)]/15 bg-white/80 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-[var(--ink)] outline-none transition focus:border-[var(--coral)] focus:ring-4 focus:ring-[var(--coral)]/20"
            />
          </label>
          <button
            type="submit"
            disabled={status === "verifying" || otp.trim().length < 6}
            className="rounded-xl bg-[var(--ink)] px-4 py-3 text-base font-semibold text-white transition hover:bg-[var(--ink)]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "verifying" ? "Signing in…" : "Sign in with code"}
          </button>
          {!standalone ? (
            <p className="text-xs text-[var(--ink)]/50">
              Prefer the link? Open the magic link from the same browser — on
              iPhone home screen, the code is more reliable.
            </p>
          ) : null}
        </form>
      ) : null}

      {message ? (
        <p
          role="status"
          className={`text-sm ${
            status === "error" ? "text-red-700" : "text-[var(--teal-dark)]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
