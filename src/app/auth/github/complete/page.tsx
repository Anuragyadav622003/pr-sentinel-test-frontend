"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeGitHubOAuth } from "@/lib/github-auth";

function GitHubCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  const callbackData = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return completeGitHubOAuth(params);
  }, [searchParams]);

  useEffect(() => {
    if (callbackData.success) {
      setStatus("success");
      router.replace("/dashboard");
      return;
    }

    setStatus("error");
  }, [callbackData, router]);

  return (
    <div className="route-loading">
      {status === "loading" && "Finishing GitHub sign-in..."}
      {status === "error" && "We could not complete GitHub sign-in. Please try again."}
    </div>
  );
}

export default function GitHubCompletePage() {
  return (
    <Suspense fallback={<div className="route-loading">Finishing GitHub sign-in...</div>}>
      <GitHubCompleteContent />
    </Suspense>
  );
}
