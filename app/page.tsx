import { redirect } from "next/navigation";

/**
 * Root landing. Middleware already protects /calendar (redirects unauthed
 * users to /sign-in). So we just bounce everyone to /calendar and let the
 * middleware decide where they actually go.
 */
export default function RootPage() {
  redirect("/calendar");
}
