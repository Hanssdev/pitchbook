import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/r/(.*)",
]);

const isOwnerRoute = createRouteMatcher(["/owner(.*)"]);
const isPlayerRoute = createRouteMatcher(["/player(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) return redirectToSignIn();

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (isOwnerRoute(req) && role !== "owner") {
    return NextResponse.redirect(new URL("/player/search", req.url));
  }

  if (isPlayerRoute(req) && role !== "player") {
    return NextResponse.redirect(new URL("/owner/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
