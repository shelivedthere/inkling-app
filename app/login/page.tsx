import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    error_description?: string;
  }>;
}

function authErrorCopy(error: string, description?: string) {
  switch (error) {
    case "expired":
      return {
        title: "That magic link expired",
        body:
          description ||
          "Request a new one below. Links are single-use and time-limited.",
      };
    case "reused":
      return {
        title: "That magic link was already used",
        body:
          description ||
          "Request a fresh link below. Opening an older email won’t work once a newer one was sent.",
      };
    case "pkce":
      return {
        title: "Couldn’t verify this browser session",
        body:
          description ||
          "Open the latest magic link in the same browser where you requested it. Requesting several links in a row invalidates earlier ones.",
      };
    case "missing_code":
      return {
        title: "Sign-in link was incomplete",
        body:
          description ||
          "Request a new magic link and open it from the same browser.",
      };
    default:
      return {
        title: "Sign-in failed",
        body:
          description ||
          "Something went wrong verifying your magic link. Request a new one below.",
      };
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = hasSupabaseEnv();
  const { error, error_description: errorDescription } = await searchParams;
  const authError = error ? authErrorCopy(error, errorDescription) : null;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,var(--sun)_0%,transparent_45%),radial-gradient(ellipse_at_80%_10%,var(--teal)_0%,transparent_40%),radial-gradient(ellipse_at_70%_80%,var(--coral)_0%,transparent_45%)] opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a1a1a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <BrandMark href={null} size="hero" />
        <p className="mt-3 max-w-sm text-lg text-[var(--ink)]/70">
          A place for big ideas and scattered brilliance.
        </p>

        <div className="mt-10 rounded-2xl border-2 border-[var(--ink)]/10 bg-white/70 p-6 shadow-[6px_6px_0_rgba(26,26,26,0.08)] backdrop-blur-sm">
          {!configured ? (
            <div className="space-y-3 text-sm text-[var(--ink)]">
              <p className="font-semibold text-red-700">
                Supabase env vars are missing
              </p>
              <p>
                Add these to{" "}
                <code className="rounded bg-[var(--ink)]/5 px-1.5 py-0.5 font-mono text-[0.9em]">
                  .env.local
                </code>
                , then restart the dev server:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-[var(--ink)]/5 p-3 font-mono text-xs leading-relaxed">
                {`NEXT_PUBLIC_SUPABASE_URL=...\nNEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
              </pre>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-[var(--ink)]">
                Sign in with a magic link
              </h1>
              <p className="mt-1 mb-5 text-sm text-[var(--ink)]/60">
                No password needed — we&apos;ll email you a one-time link.
              </p>

              {authError ? (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
                >
                  <p className="font-semibold">{authError.title}</p>
                  <p className="mt-1 text-red-700/90">{authError.body}</p>
                  {error ? (
                    <p className="mt-2 font-mono text-[11px] text-red-600/70">
                      code: {error}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <LoginForm />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
