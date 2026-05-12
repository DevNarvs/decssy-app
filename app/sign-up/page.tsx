import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign up · Decssy",
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account."
      subtitle="Decssy is a shared calendar for friend groups."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-extrabold text-accent">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm flow="signUp" />
    </AuthCard>
  );
}
