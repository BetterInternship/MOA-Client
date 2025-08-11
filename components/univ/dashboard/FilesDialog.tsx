"use client";

import * as React from "react";
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
import type { MoaHistoryFile } from "@/types/moa-request";

type FilesDialogProps = {
  files?: MoaHistoryFile[];
  title?: string;
  /** Optional custom trigger; if omitted, a default "View files" button is used */
  trigger?: React.ReactNode;
  triggerClassName?: string;
};

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

export default function FilesDialog({
  files = [],
  title = "Files",
  trigger,
  triggerClassName,
}: FilesDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
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

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={triggerClassName}
      disabled={!files || files.length === 0}
    >
      <FolderOpen className="mr-2 h-4 w-4" />
      View files
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      {/* Content-hugging width with viewport cap */}
      <DialogContent
        className="max-w-none overflow-hidden p-0"
        style={{ width: "fit-content", maxWidth: "min(95vw, 1200px)", maxHeight: "85vh" }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="bg-background sticky top-0 z-10 border-b px-6 pt-6 pb-3">
            <DialogTitle>
              {title} ({files.length})
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
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
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Checkbox
                            className="inline-flex h-4 w-4 items-center justify-center leading-none [&>span>svg]:block"
                            checked={!!selected[f.id]}
                            onCheckedChange={(v) => toggleOne(f.id, v)}
                            aria-label={`Select file ${f.name}`}
                          />
                          <div className="block truncate break-words">{f.name}</div>
                        </div>
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

          {/* Footer */}
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
