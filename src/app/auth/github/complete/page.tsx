"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeGitHubOAuth } from "@/lib/github-auth";

export default function GitHubCompletePage() {
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
