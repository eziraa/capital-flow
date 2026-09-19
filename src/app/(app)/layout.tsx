import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NavBar } from "@/components/layout/NavBar";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // The middleware already redirects unauthenticated requests, but a page
  // component or layout should never assume that on its own — this is the
  // same rule Server Actions follow: check the session where you use it.
  if (!session?.user) {
    redirect("/login");
  }

  const user = { name: session.user.name ?? null, role: session.user.role };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex min-h-screen flex-1 flex-col">
        {/* The sidebar carries primary navigation from md upward; below that,
            this top bar (with the same links) takes over. */}
        <div className="md:hidden">
          <NavBar user={user} />
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
