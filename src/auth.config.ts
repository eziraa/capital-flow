import type { NextAuthConfig } from "next-auth";

/**
 * Shared config split out from `auth.ts` so `proxy.ts` (which runs on the
 * Edge runtime) never bundles the Credentials provider's `authorize`
 * function — that function needs Prisma and bcryptjs, neither of which can
 * run on the Edge runtime. The proxy layer only needs to know whether a
 * session cookie decodes to a logged-in user, which this config alone can
 * answer.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Auth.js only auto-trusts the request Host header on Vercel. Everywhere
  // else in production (this app's Docker image included) it must be told
  // explicitly, or every request gets rejected with "UntrustedHost" — the
  // container has no public internet exposure of its own here (it's reached
  // through a mapped port on a host the operator controls), so this is safe.
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        // Signed-in users don't need to see the login page again.
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
