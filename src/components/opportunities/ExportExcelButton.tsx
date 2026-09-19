"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { exportOpportunitiesExcel } from "@/actions/export";
import { Button } from "@/components/ui/button";

export function ExportExcelButton() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await exportOpportunitiesExcel();
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      // Convert base64 string to a blob
      const byteCharacters = atob(result.data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("An error occurred while exporting.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
      <Download className="mr-2 size-4" />
      {isExporting ? "Exporting…" : "Export to Excel"}
    </Button>
  );
}
