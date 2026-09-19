import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// A second, Edge-safe NextAuth instance built from the shared config alone
// (no Credentials provider), used only to gate page requests here in the
// proxy layer. This is a convenience layer, not the security boundary —
// every Server Action still performs its own authentication and role check.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
