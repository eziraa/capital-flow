import type { Metadata } from "next";

import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = { title: "Sign in — Capital Opportunities Tracker" };

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@nexudy.test" },
  { role: "Reviewer", email: "reviewer1@nexudy.test" },
  { role: "Viewer", email: "viewer@nexudy.test" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold text-fg">Capital Opportunities Tracker</h1>
          <p className="mt-1 text-sm text-muted">Sign in to view and manage funding opportunities.</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <LoginForm callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"} />
        </div>

        <div className="mt-6 rounded-md border border-border bg-surface p-4 text-xs text-muted">
          <p className="mb-2 font-medium text-muted-fg">Seeded demo accounts (password: password123)</p>
          <ul className="flex flex-col gap-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex justify-between gap-4">
                <span>{account.role}</span>
                <span className="font-mono">{account.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
