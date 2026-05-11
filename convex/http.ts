/**
 * HTTP route surface for Convex.
 *
 * Convex Auth needs HTTP routes for OAuth callbacks (e.g., Google redirects
 * back to /api/auth/callback/google after the user approves). Calling
 * `auth.addHttpRoutes(http)` wires up every route the configured providers
 * need — no per-provider boilerplate required.
 *
 * Future plans add custom routes here too (e.g., the Clerk webhook would
 * have lived here in the original plan; we may add a Resend webhook later
 * for delivery tracking).
 */
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
