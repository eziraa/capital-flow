"use client";

import { Download, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { exportActivityCsv } from "@/actions/audit-log";
import { Button } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/download-file";

export function ExportActivityButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportActivityCsv();
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      downloadTextFile(result.data.filename, result.data.csv);
      toast.success("Activity log exported.");
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <Download />}
      Export activity log
    </Button>
  );
}
