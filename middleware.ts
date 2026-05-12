/**
 * Next.js middleware — Convex Auth route protection + onboarding gate.
 *
 * Routing rules:
 *   • Authenticated user hitting /sign-in or /sign-up → /calendar
 *   • Unauthenticated user hitting a protected route → /sign-in
 *   • Authenticated but not-yet-onboarded user hitting a protected route
 *     → /welcome (onboardedness detected via the `decssy_onboarded` cookie)
 *   • Authenticated AND onboarded user hitting /welcome/* → /calendar
 *
 * Cookie strategy: middleware runs at the edge and can't easily hit Convex
 * for a DB lookup on every request. Instead we set a `decssy_onboarded=1`
 * cookie when the user completes the onboarding mutation, and trust its
 * presence here. The cookie value is non-sensitive (just "1"). Worst case
 * if it desyncs: the client-side OnboardingGuard (TBD in a future plan)
 * could double-check via Convex query.
 */
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isWelcomePage = createRouteMatcher(["/welcome(.*)"]);
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

  // Onboarding gate (cookie-based)
  if (isAuthed) {
    const onboarded = request.cookies.get("decssy_onboarded")?.value === "1";

    if (!onboarded && isProtectedRoute(request)) {
      return nextjsMiddlewareRedirect(request, "/welcome");
    }
    if (onboarded && isWelcomePage(request)) {
      return nextjsMiddlewareRedirect(request, "/calendar");
    }
  }
});

export const config = {
  // Run on every request EXCEPT static files and Next.js internals.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
