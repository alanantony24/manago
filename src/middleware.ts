import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/register(.*)",
  "/sign-up(.*)",
  "/help(.*)",
  // Browse + navigate without forcing sign-in
  "/nearby(.*)",
  "/facilities(.*)",
  "/locate(.*)",
])

const clerkConfigured =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

function redirectHome(req: NextRequest, signedIn: boolean) {
  return NextResponse.redirect(
    new URL(signedIn ? "/nearby" : "/sign-in", req.url)
  )
}

/**
 * Always export `clerkMiddleware` when Clerk is configured so auth()
 * detection works. When keys are missing, fall back to a plain redirect.
 */
export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (req.nextUrl.pathname === "/") {
        const { userId } = await auth()
        return redirectHome(req, Boolean(userId))
      }

      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    })
  : function middleware(req: NextRequest) {
      if (req.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/nearby", req.url))
      }
      return NextResponse.next()
    }

export const config = {
  matcher: [
    // Skip Next internals and static files (images, fonts, etc.)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
