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
    const redirect = searchParams.get("redirect") || "/dashboard";

    if (error) {
      setErrorMsg(decodeURIComponent(error));
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
      <div className="route-loading">
        <p style={{ color: "red" }}>{errorMsg}</p>
        <a href="/sign-in">Back to sign-in</a>
      </div>
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
