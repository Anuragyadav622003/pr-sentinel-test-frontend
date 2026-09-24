import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a PR Sentinel account to start reviewing pull requests with AI-powered engineering insights.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
