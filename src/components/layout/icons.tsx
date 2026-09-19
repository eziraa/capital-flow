import type { SVGProps } from "react";

/** Minimal, consistent line icons for the sidebar — no icon library needed for just two. */

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.25" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.25" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.25" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.25" />
    </svg>
  );
}

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" {...props}>
      <rect x="3" y="4.5" width="18" height="4.5" rx="1" />
      <rect x="3" y="14" width="18" height="4.5" rx="1" />
    </svg>
  );
}
