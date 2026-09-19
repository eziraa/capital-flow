import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

export default function OpportunityNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-fg">Opportunity not found</h1>
      <p className="max-w-sm text-sm text-muted">
        This opportunity doesn&apos;t exist, or you may have followed an outdated link.
      </p>
      <Link href="/opportunities" className={buttonClassName("primary")}>
        Back to opportunities
      </Link>
    </div>
  );
}
