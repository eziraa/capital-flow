import Link from "next/link";
import type { UserRole } from "@prisma/client";

import { signOutAction } from "@/actions/auth";
import { RoleBadge } from "@/components/ui/Badge";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
];

export function NavBar({ user }: { user: { name: string | null; role: UserRole } }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-semibold text-fg">Capital Opportunities Tracker</span>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-fg hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-fg">{user.name}</span>
          <RoleBadge role={user.role} />
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-fg hover:bg-bg"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
