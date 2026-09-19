import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/layout/KeyboardShortcutsModal";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // The proxy layer already redirects unauthenticated requests, but a page
  // component or layout should never assume that on its own — this is the
  // same rule Server Actions follow: check the session where you use it.
  if (!session?.user) {
    redirect("/login");
  }

  const user = { name: session.user.name ?? null, role: session.user.role };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumbs />
          <div className="ml-auto">
            <KeyboardShortcutsModal />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
