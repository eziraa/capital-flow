import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuditLogClient } from "./AuditLogClient";

export const metadata = { title: "Audit Log — Capital Opportunities Tracker" };

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return <AuditLogClient />;
}
