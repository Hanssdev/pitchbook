import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/field/(.*)", // public field view
]);

// (owner) group routes — no URL segment added by route group
const isOwnerRoute = createRouteMatcher(["/dashboard(.*)"]);

// (player) group routes
const isPlayerRoute = createRouteMatcher([
  "/search(.*)",
  "/reservations(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (isOwnerRoute(req) && role !== "owner") {
    return NextResponse.redirect(new URL("/search", req.url));
  }

  if (isPlayerRoute(req) && role === "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
