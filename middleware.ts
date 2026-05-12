/**
 * Next.js middleware — Convex Auth route protection + onboarding gate +
 * invite-flow public surfaces.
 *
 * Routing rules:
 *   • /sign-in /sign-up + authed → /calendar
 *   • Any protected route + unauthed → /sign-in
 *   • /join/[token]/accept + unauthed → /sign-in (we read pendingInvite
 *     from localStorage after auth)
 *   • /join/[token] (no /accept) is PUBLIC — anyone can see the preview
 *   • Authed + not-onboarded + protected route → /welcome
 *   • Authed + onboarded + /welcome/* → /calendar
 */
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isWelcomePage = createRouteMatcher(["/welcome(.*)"]);
const isJoinAccept = createRouteMatcher(["/join/:token/accept"]);
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

  if (isJoinAccept(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
  // /join/[token] (no /accept) is intentionally NOT matched here — it's public.

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
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
