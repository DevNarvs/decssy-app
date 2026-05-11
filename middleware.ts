/**
 * Next.js middleware — Convex Auth route protection.
 *
 * Behaviour:
 *   • Authenticated users hitting /sign-in or /sign-up → redirect to /calendar
 *   • Unauthenticated users hitting any /calendar /groups /find /inbox /settings
 *     route → redirect to /sign-in
 *   • Public routes (sign-in, sign-up, /join/* invite landing in future plans)
 *     are accessible to everyone
 *
 * `convexAuthNextjsMiddleware` runs BEFORE every request matched by `config`
 * and exposes the auth context via the second argument.
 */
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isProtectedRoute = createRouteMatcher([
  "/calendar(.*)",
  "/groups(.*)",
  "/find(.*)",
  "/inbox(.*)",
  "/settings(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (isSignInPage(request) && isAuthed) {
    return nextjsMiddlewareRedirect(request, "/calendar");
  }

  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  // Run on every request EXCEPT static files and Next.js internals.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
