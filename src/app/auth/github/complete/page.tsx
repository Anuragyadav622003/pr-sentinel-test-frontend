"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeGitHubOAuth } from "@/lib/github-auth";

function GitHubCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const result = completeGitHubOAuth(searchParams);
    if (result.success) {
      router.replace("/dashboard");
    }
  }, [router, searchParams]); 

  return <div className="route-loading">Finishing GitHub sign-in...</div>;
}

export default function GitHubCompletePage() {
  return (
    <Suspense fallback={<div className="route-loading">Finishing GitHub sign-in...</div>}>
      <GitHubCompleteContent />
    </Suspense>
  );
}
