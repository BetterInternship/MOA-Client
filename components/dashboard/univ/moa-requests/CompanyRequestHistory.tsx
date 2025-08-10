"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, FolderOpen } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { MoaRequest, MoaHistoryItem, MoaHistoryFile } from "@/types/moa-request";

/* ---------------- utils ---------------- */

function sortDate(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}

async function downloadFiles(files: MoaHistoryFile[]) {
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
      await new Promise((r) => setTimeout(r, 120));
    } catch (e) {
      console.error("Download error:", e);
    }
  }
}

/* -------------- dialog component -------------- */

function FilesDialog({
  files = [],
  triggerClassName,
}: {
  files?: MoaHistoryFile[];
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // reset selection when dialog opens/closes or files change
    setSelected({});
  }, [open, files]);

  const countSelected = React.useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const allChecked = files.length > 0 && files.every((f) => selected[f.id]);
  const someChecked = !allChecked && files.some((f) => selected[f.id]);

  function toggleAll(val: boolean | "indeterminate") {
    const next: Record<string, boolean> = {};
    if (val) files.forEach((f) => (next[f.id] = true));
    setSelected(next);
  }

  function toggleOne(id: string, val: boolean | "indeterminate") {
    setSelected((prev) => ({ ...prev, [id]: !!val }));
  }

  async function handleDownloadSelected() {
    const toDownload = files.filter((f) => selected[f.id]);
    if (toDownload.length === 0) return;
    await downloadFiles(toDownload);
  }

  async function handleDownloadAll() {
    if (!files.length) return;
    await downloadFiles(files);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          disabled={!files || files.length === 0}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          View files
        </Button>
      </DialogTrigger>

      {/* content-hugging width + viewport cap; prevent shell overflow */}
      <DialogContent
        className="max-w-none overflow-hidden p-0"
        style={{ width: "fit-content", maxWidth: "min(95vw, 1200px)", maxHeight: "85vh" }}
      >
        {/* Column layout */}
        <div className="flex h-full flex-col">
          {/* Sticky header */}
          <DialogHeader className="bg-background sticky top-0 z-10 border-b px-6 pt-6 pb-3">
            <DialogTitle>Files ({files.length})</DialogTitle>
          </DialogHeader>

          {/* Only middle scrolls; also hide horizontal overflow */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all files"
                  />
                  <span className="text-sm">Select all</span>
                </div>
                <div className="text-muted-foreground text-xs">{countSelected} selected</div>
              </div>

              <div className="rounded-md border p-2">
                {files.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No files.</div>
                ) : (
                  <ul className="space-y-2">
                    {files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-2">
                        {/* Left lane must be shrinkable */}
                        <label className="inline-flex min-w-0 flex-1 items-center gap-2 leading-none">
                          <Checkbox
                            className="inline-flex h-4 w-4 items-center justify-center align-middle leading-none [&>span>svg]:block"
                            checked={!!selected[f.id]}
                            onCheckedChange={(v) => toggleOne(f.id, v)}
                            aria-label={`Select file ${f.name}`}
                          />
                          {/* Truncate long names safely */}
                          <div className="block truncate break-words">{f.name}</div>
                        </label>

                        {/* Right control should not grow */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => downloadFiles([f])}
                          title={`Download ${f.name}`}
                          aria-label={`Download ${f.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <DialogFooter className="bg-background sticky bottom-0 z-10 border-t px-6 py-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected({})}
                disabled={countSelected === 0}
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadSelected}
                disabled={countSelected === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download selected ({countSelected})
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAll}
                disabled={files.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download all
              </Button>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------- main table -------------- */

export default function CompanyRequestHistory({ req }: { req: MoaRequest }) {
  const [selectedRows, setSelectedRows] = React.useState<MoaHistoryItem[]>([]);
  const data: MoaHistoryItem[] = req.history;

  async function handleDownloadRow(rowIdx: number) {
    const files = data[rowIdx].files || [];
    if (files.length === 0) return;
    await downloadFiles(files);
  }

  const filesInSelectedRows = React.useMemo(() => {
    const all: MoaHistoryFile[] = [];
    selectedRows.forEach((r) => r.files?.forEach((f) => all.push(f)));
    return all;
  }, [selectedRows]);

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
          return <FilesDialog files={files} />;
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
    []
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
          onSelectionChange={setSelectedRows}
          toolbarActions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={filesInSelectedRows.length === 0}
                onClick={() => downloadFiles(filesInSelectedRows)}
                className="gap-2"
                title="Download files for all selected rows"
              >
                <Download className="h-4 w-4" />
                Download for selected rows ({filesInSelectedRows.length})
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
