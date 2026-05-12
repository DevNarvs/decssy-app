"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { getPendingInvite } from "@/lib/hooks/usePendingInvite";

export default function CalendarPage() {
  const router = useRouter();

  // If user signed up via an invite link, the token was stashed in
  // localStorage. Redirect to the accept page to consume it. The accept
  // page clears the token after a successful join.
  useEffect(() => {
    const token = getPendingInvite();
    if (token) {
      router.replace(`/join/${token}/accept`);
    }
  }, [router]);

  return (
    <PlaceholderScreen
      title="Calendar."
      comingIn="Calendar UI ships in Plan 5."
    />
  );
}
