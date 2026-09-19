import type { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActingUser = {
  id: string;
  name: string | null;
  role: UserRole;
};

/**
 * The only place a Server Action should learn who is calling it. Identity
 * comes from the verified session — never from form data — but role and
 * disabled status are re-read from PostgreSQL on every call rather than
 * trusted from the (potentially stale) session JWT. Without this, an admin
 * disabling a user or changing their role would have no effect until that
 * user's session expired and they logged back in — the exact "even if a
 * request is made outside the user interface" gap this app treats as a
 * real security boundary everywhere else.
 */
export async function getActingUser(): Promise<ActingUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    return null;
  }

  return { id: user.id, name: user.name, role: user.role };
}
