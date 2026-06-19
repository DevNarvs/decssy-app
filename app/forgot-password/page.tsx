import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset password · Decssy",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password."
      subtitle="We'll email you a code to set a new one."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
