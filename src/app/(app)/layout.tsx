import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NavBar } from "@/components/layout/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // The middleware already redirects unauthenticated requests, but a page
  // component or layout should never assume that on its own — this is the
  // same rule Server Actions follow: check the session where you use it.
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar user={{ name: session.user.name ?? null, role: session.user.role }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
