import type { UserRole } from "@prisma/client";

import { auth } from "@/auth";

export type ActingUser = {
  id: string;
  name: string | null;
  role: UserRole;
};

/**
 * The only place a Server Action should learn who is calling it. Identity
 * and role always come from the verified session — never from form data.
 */
export async function getActingUser(): Promise<ActingUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    role: session.user.role,
  };
}
