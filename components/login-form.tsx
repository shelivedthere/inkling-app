"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage("Check your email for a magic link to sign in.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not send magic link. Check your Supabase env vars."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
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
        {status === "loading" ? "Sending…" : "Send magic link"}
      </button>

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
    </form>
  );
}
