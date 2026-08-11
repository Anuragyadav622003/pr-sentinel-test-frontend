"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";

/**
 * Inner component — must be wrapped in <Suspense> because it calls
 * useSearchParams(), which suspends during SSR/static rendering.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const requestedRedirect = searchParams.get("redirect");
    const redirect = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/dashboard";

    if (error) {
      setErrorMsg(error);
      return;
    }

    // The backend already set the HttpOnly cookie before redirecting here.
    // Call /api/auth/me to validate the cookie and hydrate localStorage.
    fetchCurrentUser()
      .then(() => {
        router.replace(redirect);
      })
      .catch(() => {
        setErrorMsg("Could not complete sign-in. Please try again.");
      });
  }, [searchParams, router]);

  if (errorMsg) {
    return (
      <main className="route-loading auth-callback-error" role="alert">
        <div className="auth-callback-card">
          <p className="eyebrow">SIGN-IN ERROR</p>
          <h1>We couldn&apos;t finish connecting your account</h1>
          <p>{errorMsg}</p>
          <a className="primary-button" href="/sign-in">Return to sign in</a>
        </div>
      </main>
    );
  }

  return <div className="route-loading">Finishing sign-in…</div>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="route-loading">Loading…</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
