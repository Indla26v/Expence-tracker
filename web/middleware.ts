export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - Next.js internals
     * - public assets
     * - auth routes (NextAuth + mobile-login)
     * - login page
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)",
  ],
};

