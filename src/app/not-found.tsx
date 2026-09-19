import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold text-fg">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className={buttonClassName("primary")}>
        Go home
      </Link>
    </main>
  );
}
