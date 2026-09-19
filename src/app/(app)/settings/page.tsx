import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings — Capital Opportunities Tracker" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <SettingsClient user={{ name: session.user.name ?? null, email: session.user.email ?? null }} />;
}
