"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/demo-auth";

export default function AuthGate() {
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
    else router.replace("/sign-in");
  }, [router]);

  return <div className="route-loading">Loading workspace...</div>;
}
