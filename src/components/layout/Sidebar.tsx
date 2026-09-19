"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { signOutAction } from "@/actions/auth";
import { RoleBadge } from "@/components/ui/Badge";
import { DashboardIcon, ListIcon } from "@/components/layout/icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/opportunities", label: "Opportunities", icon: ListIcon },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user }: { user: { name: string | null; role: UserRole } }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <span className="text-sm font-semibold leading-tight text-fg">
          Capital Opportunities Tracker
        </span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted-fg hover:bg-bg hover:text-fg"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-muted-fg">{user.name}</span>
          <RoleBadge role={user.role} />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-fg hover:bg-bg"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
