import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment NextAuth's built-in types so the rest of the app can rely on
// `session.user.id` and `session.user.role` being present and typed.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// `next-auth/jwt` re-exports `JWT` from `@auth/core/jwt` (`export * from ...`)
// rather than declaring it directly, so the interface augmentation above
// does not merge into the interface Auth.js's own callback types actually
// reference. Augmenting the real module makes `token.id` / `token.role`
// resolve to concrete types instead of `unknown` inside callbacks.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
