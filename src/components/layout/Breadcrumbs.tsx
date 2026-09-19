"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/" }];

  if (segments[0] === "opportunities") {
    crumbs.push({ label: "Opportunities", href: "/opportunities" });
    if (segments[1]) {
      // The detail page passes the company name via a data attribute — we fall
      // back to a short ID slice so the crumb is always shown immediately.
      const label =
        typeof document !== "undefined"
          ? (document.querySelector("[data-company-name]")?.getAttribute("data-company-name") ?? segments[1].slice(0, 8) + "…")
          : segments[1].slice(0, 8) + "…";
      crumbs.push({ label });
    }
  } else if (segments[0] === "admin") {
    crumbs.push({ label: "Admin" });
    if (segments[1] === "users") crumbs.push({ label: "Users", href: "/admin/users" });
    if (segments[1] === "audit-log") crumbs.push({ label: "Audit Log", href: "/admin/audit-log" });
  } else if (segments[0] === "settings") {
    crumbs.push({ label: "Settings" });
  }

  return crumbs;
}

export function Breadcrumbs({ companyName }: { companyName?: string }) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  // Override the last crumb with the real company name when provided
  if (companyName && crumbs.length > 0) {
    crumbs[crumbs.length - 1] = { label: companyName };
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index === 0 ? <Home className="size-3.5" aria-hidden="true" /> : null}
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-foreground" : ""}>{crumb.label}</span>
              )}
              {!isLast ? <ChevronRight className="size-3.5" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
