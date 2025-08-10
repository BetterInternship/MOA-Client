"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { MoaRequest, MoaHistoryItem, MoaHistoryFile } from "@/types/moa-request";

type Props = { req: MoaRequest };

// simple date sorter
function sortDate(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}

export default function CompanyRequestHistory({ req }: Props) {
  // track selected rows from DataTable
  const [selectedRows, setSelectedRows] = React.useState<MoaHistoryItem[]>([]);
  // track selected files via composite keys: `${rowIdx}:${file.id}`
  const [fileSel, setFileSel] = React.useState<Record<string, boolean>>({});

  const data: MoaHistoryItem[] = req.history;

  function toggleFile(rowIdx: number, fileId: string, checked: boolean | "indeterminate") {
    const key = `${rowIdx}:${fileId}`;
    setFileSel((prev) => ({ ...prev, [key]: !!checked }));
  }

  // gather selected files across all rows
  const selectedFiles = React.useMemo<MoaHistoryFile[]>(() => {
    const out: MoaHistoryFile[] = [];
    data.forEach((row, i) => {
      row.files?.forEach((f) => {
        if (fileSel[`${i}:${f.id}`]) out.push(f);
      });
    });
    return out;
  }, [fileSel, data]);

  function selectFilesInSelectedRows() {
    const next = { ...fileSel };
    selectedRows.forEach((row) => {
      const i = data.indexOf(row);
      if (i >= 0) {
        row.files?.forEach((f) => {
          next[`${i}:${f.id}`] = true;
        });
      }
    });
    setFileSel(next);
  }

  async function downloadFiles(files: MoaHistoryFile[]) {
    // For big batches, consider a server-side zip. This sequential client approach is fine for small sets.
    for (const f of files) {
      try {
        const res = await fetch(f.url);
        if (!res.ok) throw new Error(`Failed to fetch ${f.name}`);
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = f.name || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        // small delay helps some browsers register consecutive clicks
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.error("Download error:", e);
      }
    }
  }

  async function handleDownloadSelected() {
    if (selectedFiles.length === 0) return;
    await downloadFiles(selectedFiles);
  }

  async function handleDownloadRow(rowIdx: number) {
    const files = data[rowIdx].files || [];
    if (files.length === 0) return;
    await downloadFiles(files);
  }

  const columns = React.useMemo<ColumnDef<MoaHistoryItem>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessorFn: (row) => row.date,
        sortingFn: (a, b) => sortDate(a.getValue("date"), b.getValue("date")),
        cell: ({ getValue }) => (
          <div className="text-muted-foreground text-xs">{String(getValue())}</div>
        ),
      },
      {
        id: "event",
        header: "Event",
        accessorFn: (row) => row.text,
        cell: ({ getValue }) => <div className="text-sm">{String(getValue())}</div>,
      },
      {
        id: "files",
        header: "Files",
        enableSorting: false,
        cell: ({ row }) => {
          const files = row.original.files || [];
          if (!files.length) return <span className="text-muted-foreground text-xs">—</span>;

          return (
            <div className="flex flex-wrap items-center gap-3">
              {files.map((f) => {
                const key = `${row.index}:${f.id}`;
                const checked = !!fileSel[key];
                return (
                  <label key={key} className="inline-flex items-center gap-2 leading-none">
                    <Checkbox
                      className="inline-flex h-4 w-4 items-center justify-center align-middle leading-none [&>span>svg]:block"
                      checked={checked}
                      onCheckedChange={(val) => toggleFile(row.index, f.id, val)}
                      aria-label={`Select file ${f.name}`}
                    />
                    <Badge variant="secondary" className="max-w-[220px] truncate">
                      {f.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => downloadFiles([f])}
                      aria-label={`Download ${f.name}`}
                      title={`Download ${f.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </label>
                );
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            disabled={!row.original.files || row.original.files.length === 0}
            onClick={() => handleDownloadRow(row.index)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download row
          </Button>
        ),
      },
    ],
    [fileSel]
  );

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Company Request History</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<MoaHistoryItem, unknown>
          className="pt-2"
          columns={columns}
          data={data}
          searchKey="text"
          enableRowSelection
          initialSorting={[{ id: "date", desc: true }]}
          onSelectionChange={setSelectedRows} // <-- uses your extended prop
          toolbarActions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={selectedFiles.length === 0}
                onClick={handleDownloadSelected}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download selected files ({selectedFiles.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={selectFilesInSelectedRows}
                disabled={selectedRows.length === 0}
              >
                Select files in selected rows
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFileSel({})}
                disabled={Object.keys(fileSel).length === 0}
              >
                Clear file selection
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
