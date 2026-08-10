import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/notes";
  }
  return next;
}

function classifyAuthFailure(input: {
  message?: string | null;
  code?: string | null;
  status?: number | null;
}) {
  const message = (input.message ?? "").toLowerCase();
  const code = (input.code ?? "").toLowerCase();

  if (
    code.includes("otp_expired") ||
    message.includes("expired") ||
    message.includes("otp_expired")
  ) {
    return "expired";
  }

  if (
    code.includes("flow_state") ||
    code.includes("bad_code_verifier") ||
    message.includes("code verifier") ||
    message.includes("pkce") ||
    message.includes("flow state")
  ) {
    return "pkce";
  }

  if (
    code.includes("reuse") ||
    message.includes("already been used") ||
    message.includes("one-time")
  ) {
    return "reused";
  }

  return "auth";
}

function loginErrorRedirect(
  origin: string,
  reason: string,
  detail?: string | null
) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  if (detail) {
    // Keep it short enough for a query string while still useful.
    url.searchParams.set("error_description", detail.slice(0, 280));
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  // Supabase can bounce failed email links here with its own error params
  // (before we even get a code to exchange).
  const providerError = searchParams.get("error");
  const providerErrorCode = searchParams.get("error_code");
  const providerErrorDescription = searchParams.get("error_description");

  if (providerError) {
    const reason = classifyAuthFailure({
      message: providerErrorDescription ?? providerError,
      code: providerErrorCode ?? providerError,
    });
    console.error("[auth/callback] Provider returned an error", {
      error: providerError,
      errorCode: providerErrorCode,
      errorDescription: providerErrorDescription,
      reason,
    });
    return loginErrorRedirect(
      origin,
      reason,
      providerErrorDescription ?? providerError
    );
  }

  if (!code) {
    console.error("[auth/callback] Missing ?code= in callback URL", {
      href: requestUrl.href,
      params: Object.fromEntries(searchParams.entries()),
    });
    return loginErrorRedirect(
      origin,
      "missing_code",
      "Magic link was missing an auth code. Request a new link and open it in the same browser."
    );
  }

  const cookieStore = await cookies();
  const successRedirect = NextResponse.redirect(new URL(next, origin));

  // Build the client against both the cookie store and the redirect response
  // so session cookies from exchangeCodeForSession actually stick on the 302.
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          successRedirect.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const reason = classifyAuthFailure({
      message: error.message,
      code: "code" in error ? String(error.code) : null,
      status: error.status,
    });
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      name: error.name,
      code: "code" in error ? error.code : undefined,
      reason,
      // Helpful for PKCE diagnosis without dumping cookie values.
      hasCookies: cookieStore.getAll().some((cookie) =>
        cookie.name.includes("code-verifier")
      ),
      cookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    });
    return loginErrorRedirect(origin, reason, error.message);
  }

  return successRedirect;
}
