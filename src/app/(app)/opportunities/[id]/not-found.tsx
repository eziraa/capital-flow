import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OpportunityNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-foreground">Opportunity not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This opportunity doesn&apos;t exist, or you may have followed an outdated link.
      </p>
      <Button asChild>
        <Link href="/opportunities">Back to opportunities</Link>
      </Button>
    </div>
  );
}
