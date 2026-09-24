import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PR Sentinel to review pull requests with AI-powered engineering insights.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
