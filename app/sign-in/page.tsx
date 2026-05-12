import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign in · Decssy",
};

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome back."
      subtitle="Sign in to see what your groups are up to."
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="font-extrabold text-accent">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm flow="signIn" />
    </AuthCard>
  );
}
