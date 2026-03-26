"use client";

import { RowEntry } from "@/lib/types";
import { toast } from "sonner";

// export forms to csv.
export const downloadFormsAsCsv = (forms: RowEntry[][][]) => {
  // display error if input format is invalid.
  if (!forms || !Array.isArray(forms) || forms.length === 0) {
    toast.error("No data to export");
    return;
  }

  try {
    // get system date and time for file name.
    const timestamp = new Date().toISOString().split("T")[0];
    const now = Date.now();
    let exportedCount = 0;

    // generate each form one by one.
    forms.forEach((form, index) => {
      if (!form || form.length === 0) return;
      exportedCount++;

      // get unique columns for the form.
      const uniqueColumns = Array.from(new Set(
        form.flatMap(row => row.map(entry => entry.col))
      ));

      // generate header row.
      const header = uniqueColumns.map((col) => `"${col}"`).join(",");
      
      // generate data rows.
      const rows = form.map((rowEntries) => {
        const rowData = uniqueColumns.map((col) => {
          const entry = rowEntries.find((e) => e.col === col);
          let value = entry?.value ?? "";

          if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value);
          }

          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        });

        return rowData.join(",");
      });

      // Add UTF-8 BOM to ensure proper encoding in Excel and other tools.
      const csvContent = "\uFEFF" + [header, ...rows].join("\n");
      
      // create blob for download.
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const firstRow = form[0];
      const formNameEntry = firstRow?.find(e => e.col === "form_name" || e.col === "form_label");
      const safeFormName = formNameEntry?.value
        ? String(formNameEntry.value).replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
        : `form_type_${index + 1}`;
      
      const filename = `export_${safeFormName}_${timestamp}_${now}.csv`;

      // trigger download
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    const totalRecords = forms.reduce((acc, curr) => acc + (curr?.length || 0), 0);
    toast.success(`Exported ${exportedCount} file${exportedCount === 1 ? "" : "s"} with ${totalRecords} total record${totalRecords === 1 ? "" : "s"}`);
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export CSV. Plesae try again.");
  }
};